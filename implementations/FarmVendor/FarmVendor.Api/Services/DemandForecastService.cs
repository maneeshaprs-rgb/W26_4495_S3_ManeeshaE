using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Services.Forecasting;
using Microsoft.EntityFrameworkCore;
using FarmVendor.Api.Models.DTOs;

namespace FarmVendor.Api.Services;

public class DemandForecastService
{
    private readonly AppDbContext _db;
    private readonly MLDemandForecastingEngine _mlEngine;

    public DemandForecastService(AppDbContext db)
    {
        _db = db;
        _mlEngine = new MLDemandForecastingEngine();
    }

    // =========================================================
    // 1) MOVING AVERAGE FORECAST
    // =========================================================
    public async Task<List<DemandForecast>> GenerateMovingAverageForecastsAsync(
        DateTime forecastDate,
        int lookbackPeriods = 3)
    {
        if (lookbackPeriods <= 0)
            throw new ArgumentException("LookbackPeriods must be greater than 0.");

        var groupedRequests = await _db.DemandRequest
            .AsNoTracking()
            .Where(r => r.CreatedAt < forecastDate)
            .OrderByDescending(r => r.CreatedAt)
            .GroupBy(r => new { r.VendorId, r.ProductId })
            .Select(g => new
            {
                g.Key.VendorId,
                g.Key.ProductId,
                Requests = g.OrderByDescending(x => x.CreatedAt)
                            .Take(lookbackPeriods)
                            .Select(x => x.QuantityRequested)
                            .ToList()
            })
            .ToListAsync();

        var forecasts = new List<DemandForecast>();

        foreach (var group in groupedRequests)
        {
            if (group.Requests.Count == 0) continue;

            var avgQty = group.Requests.Average();

            forecasts.Add(new DemandForecast
            {
                VendorId = group.VendorId,
                ProductId = group.ProductId,
                ForecastDate = forecastDate.Date,
                ForecastQty = Math.Round(avgQty, 2),
                ModelName = "MovingAverage",
                LookbackPeriods = lookbackPeriods,
                CreatedAt = DateTime.UtcNow
            });
        }

        return forecasts;
    }

    // =========================================================
    // 2) ML.NET FORECAST
    // =========================================================
    public async Task<List<DemandForecast>> GenerateMlForecastsAsync(
        DateTime forecastStartDate,
        int horizon = 3,
        string granularity = "Daily")
    {
        if (horizon <= 0)
            throw new ArgumentException("Horizon must be greater than 0.");

        var requestGroups = await _db.DemandRequest
            .AsNoTracking()
            .Where(r => r.CreatedAt < forecastStartDate)
            .GroupBy(r => new { r.VendorId, r.ProductId })
            .Select(g => new
            {
                g.Key.VendorId,
                g.Key.ProductId
            })
            .ToListAsync();

        var allForecasts = new List<DemandForecast>();

        foreach (var group in requestGroups)
        {
            var series = await LoadAggregatedDemandSeriesAsync(
                group.ProductId,
                group.VendorId,
                forecastStartDate,
                granularity);

            if (series.Count < 5)
            {
                Console.WriteLine(
                    $"Skipped ML forecast for Vendor={group.VendorId}, Product={group.ProductId}, Reason=Not enough history, SeriesCount={series.Count}");
                continue;
            }

            var orderedValues = series
                .OrderBy(x => x.PeriodDate)
                .Select(x => (float)x.TotalQuantity)
                .ToList();

            ForecastTrainingResult mlResult;

            try
            {
                var safeHorizon = Math.Min(horizon, Math.Max(1, orderedValues.Count / 2));

                mlResult = _mlEngine.TrainAndForecast(orderedValues, safeHorizon);

                if (mlResult.Forecast == null || mlResult.Forecast.Count == 0)
                {
                    Console.WriteLine(
                        $"ML forecast returned no results for Vendor={group.VendorId}, Product={group.ProductId}");
                    continue;
                }

                var lastHistoryDate = series.Max(x => x.PeriodDate);

                for (int i = 0; i < mlResult.Forecast.Count; i++)
                {
                    DateTime nextDate =
                        granularity.Equals("Weekly", StringComparison.OrdinalIgnoreCase)
                            ? lastHistoryDate.AddDays(7 * (i + 1))
                            : lastHistoryDate.AddDays(i + 1);

                    decimal qty = Math.Round(
                        Convert.ToDecimal(Math.Max(0, mlResult.Forecast[i])), 2);

                    allForecasts.Add(new DemandForecast
                    {
                        VendorId = group.VendorId,
                        ProductId = group.ProductId,
                        ForecastDate = nextDate.Date,
                        ForecastQty = qty,
                        ModelName = "MLNET_SSA",
                        LookbackPeriods = null,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"ML forecast failed for Vendor={group.VendorId}, Product={group.ProductId}. Error={ex.Message}");
                continue;
            }
        }

        Console.WriteLine($"Total ML forecasts generated: {allForecasts.Count}");
        return allForecasts;
    }

    // =========================================================
    // 3) SAVE FORECASTS
    // =========================================================
    public async Task<int> SaveForecastsAsync(List<DemandForecast> forecasts)
    {
        if (forecasts.Count == 0) return 0;

        foreach (var fc in forecasts)
        {
            var existing = await _db.DemandForecast
                .Where(x =>
                    x.ForecastDate == fc.ForecastDate &&
                    x.VendorId == fc.VendorId &&
                    x.ProductId == fc.ProductId &&
                    x.ModelName == fc.ModelName)
                .ToListAsync();

            if (existing.Count > 0)
                _db.DemandForecast.RemoveRange(existing);
        }

        await _db.DemandForecast.AddRangeAsync(forecasts);
        return await _db.SaveChangesAsync();
    }

    // =========================================================
    // 4) OPTIONAL COMPARISON METHOD
    // =========================================================
    public async Task<object?> CompareForecastForPairAsync(
        string vendorId,
        int productId,
        DateTime forecastDate,
        int movingAverageLookback = 3)
    {
        var recentRequests = await _db.DemandRequest
            .AsNoTracking()
            .Where(r => r.VendorId == vendorId &&
                        r.ProductId == productId &&
                        r.CreatedAt < forecastDate)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        if (recentRequests.Count < 3)
            return null;

        var movingAverage = recentRequests
            .Take(movingAverageLookback)
            .Average(x => x.QuantityRequested);

        var dailySeries = await LoadAggregatedDemandSeriesAsync(
            productId,
            vendorId,
            forecastDate,
            "Daily");

        decimal mlPrediction = 0;

        if (dailySeries.Count >= 5)
        {
            try
            {
                var orderedValues = dailySeries
                    .OrderBy(x => x.PeriodDate)
                    .Select(x => (float)x.TotalQuantity)
                    .ToList();

                var mlResult = _mlEngine.TrainAndForecast(orderedValues, 1);

                if (mlResult.Forecast.Count > 0)
                {
                    mlPrediction = Math.Round(
                        Convert.ToDecimal(Math.Max(0, mlResult.Forecast[0])), 2);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Compare forecast ML failed for Vendor={vendorId}, Product={productId}. Error={ex.Message}");
            }
        }

        return new
        {
            VendorId = vendorId,
            ProductId = productId,
            ForecastDate = forecastDate.Date,
            MovingAverageForecast = Math.Round(movingAverage, 2),
            MlNetForecast = mlPrediction
        };
    }

    // =========================================================
    // 5) CHART DATA
    // =========================================================
    public async Task<List<ForecastChartPointDto>> GetForecastChartDataAsync(
        string vendorId,
        int productId,
        DateTime forecastDate,
        string modelName = "MLNET_SSA")
    {
        var history = await _db.DemandRequest
            .AsNoTracking()
            .Where(r => r.VendorId == vendorId &&
                        r.ProductId == productId &&
                        r.CreatedAt < forecastDate)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new ForecastChartPointDto
            {
                Date = r.CreatedAt.ToString("yyyy-MM-dd"),
                Quantity = r.QuantityRequested,
                Series = "Historical"
            })
            .ToListAsync();

        history = history
            .OrderBy(x => x.Date)
            .ToList();

        var forecasts = await _db.DemandForecast
            .AsNoTracking()
            .Where(f => f.VendorId == vendorId &&
                        f.ProductId == productId &&
                        f.ModelName == modelName &&
                        f.ForecastDate >= forecastDate.Date)
            .OrderBy(f => f.ForecastDate)
            .Take(10)
            .Select(f => new ForecastChartPointDto
            {
                Date = f.ForecastDate.ToString("yyyy-MM-dd"),
                Quantity = f.ForecastQty,
                Series = "Forecast"
            })
            .ToListAsync();

        return history.Concat(forecasts).ToList();
    }

    // =========================================================
    // 6) PRIVATE HELPER FOR DAILY / WEEKLY SERIES
    // =========================================================
    private async Task<List<AggregatedDemandPoint>> LoadAggregatedDemandSeriesAsync(
        int productId,
        string vendorId,
        DateTime beforeDate,
        string granularity)
    {
        var raw = await _db.DemandRequest
            .AsNoTracking()
            .Where(r => r.ProductId == productId &&
                        r.VendorId == vendorId &&
                        r.CreatedAt < beforeDate)
            .OrderBy(r => r.CreatedAt)
            .Select(r => new
            {
                r.CreatedAt,
                r.QuantityRequested
            })
            .ToListAsync();

        if (granularity.Equals("Weekly", StringComparison.OrdinalIgnoreCase))
        {
            return raw
                .GroupBy(x => StartOfWeek(x.CreatedAt.Date))
                .Select(g => new AggregatedDemandPoint
                {
                    PeriodDate = g.Key,
                    TotalQuantity = g.Sum(x => x.QuantityRequested)
                })
                .OrderBy(x => x.PeriodDate)
                .ToList();
        }

        return raw
            .GroupBy(x => x.CreatedAt.Date)
            .Select(g => new AggregatedDemandPoint
            {
                PeriodDate = g.Key,
                TotalQuantity = g.Sum(x => x.QuantityRequested)
            })
            .OrderBy(x => x.PeriodDate)
            .ToList();
    }

    private static DateTime StartOfWeek(DateTime date)
    {
        int diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-diff).Date;
    }

    private class AggregatedDemandPoint
    {
        public DateTime PeriodDate { get; set; }
        public decimal TotalQuantity { get; set; }
    }
}