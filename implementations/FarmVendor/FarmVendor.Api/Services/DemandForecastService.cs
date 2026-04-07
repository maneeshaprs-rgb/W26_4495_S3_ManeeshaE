using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using FarmVendor.Api.Services.Forecasting;
using Microsoft.EntityFrameworkCore;

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
    // 0) GET ELIGIBLE FORECAST PAIRS FOR A LOGGED-IN FARMER
    //    Only products available in farmer inventory
    //    Only vendors who requested those products
    // =========================================================
    public async Task<List<EligibleForecastPairDto>> GetEligiblePairsForFarmerAsync(string farmerId, DateTime forecastDate)
    {
        var availableProductIds = await _db.InventoryLot
            .AsNoTracking()
            .Where(i =>
                i.FarmerId == farmerId &&
                i.QuantityAvailable > 0 &&
                i.Product.IsActive)
            .Select(i => i.ProductId)
            .Distinct()
            .ToListAsync();

        if (availableProductIds.Count == 0)
            return new List<EligibleForecastPairDto>();

        var eligiblePairs = await _db.DemandRequest
            .AsNoTracking()
            .Where(r =>
                availableProductIds.Contains(r.ProductId) &&
                r.CreatedAt < forecastDate)
            .Select(r => new EligibleForecastPairDto
            {
                VendorId = r.VendorId,
                ProductId = r.ProductId
            })
            .Distinct()
            .ToListAsync();

        return eligiblePairs;
    }

    // =========================================================
    // 1) MOVING AVERAGE FORECAST
    //    FILTERED FOR FARMER'S AVAILABLE PRODUCTS
    // =========================================================
    public async Task<List<DemandForecast>> GenerateMovingAverageForecastsForFarmerAsync(
        string farmerId,
        DateTime forecastDate,
        int lookbackPeriods = 3)
    {
        if (lookbackPeriods <= 0)
            throw new ArgumentException("LookbackPeriods must be greater than 0.");

        var eligiblePairs = await GetEligiblePairsForFarmerAsync(farmerId, forecastDate);

        if (eligiblePairs.Count == 0)
            return new List<DemandForecast>();

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

        var eligibleSet = eligiblePairs
            .Select(x => $"{x.VendorId}__{x.ProductId}")
            .ToHashSet();

        var forecasts = new List<DemandForecast>();

        foreach (var group in groupedRequests)
        {
            var key = $"{group.VendorId}__{group.ProductId}";
            if (!eligibleSet.Contains(key)) continue;
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
    //    FILTERED FOR FARMER'S AVAILABLE PRODUCTS
    // =========================================================
    public async Task<List<DemandForecast>> GenerateMlForecastsForFarmerAsync(
        string farmerId,
        DateTime forecastStartDate,
        int horizon = 7,
        string granularity = "Daily")
    {
        if (horizon <= 0)
            throw new ArgumentException("Horizon must be greater than 0.");

        var eligiblePairs = await GetEligiblePairsForFarmerAsync(farmerId, forecastStartDate);

        if (eligiblePairs.Count == 0)
            return new List<DemandForecast>();

        var allForecasts = new List<DemandForecast>();

        foreach (var pair in eligiblePairs)
        {
            var series = await LoadAggregatedDemandSeriesAsync(
                pair.ProductId,
                pair.VendorId,
                forecastStartDate,
                granularity);

            if (series.Count < 3)
            {
                Console.WriteLine(
                    $"Skipped ML forecast for Vendor={pair.VendorId}, Product={pair.ProductId}, Reason=Not enough history, SeriesCount={series.Count}");
                continue;
            }

            var orderedValues = series
                .OrderBy(x => x.PeriodDate)
                .Select(x => (float)x.TotalQuantity)
                .ToList();

            try
            {
                var safeHorizon = Math.Min(horizon, Math.Max(1, orderedValues.Count / 2));
                var mlResult = _mlEngine.TrainAndForecast(orderedValues, safeHorizon);

                if (mlResult.Forecast == null || mlResult.Forecast.Count == 0)
                {
                    Console.WriteLine(
                        $"ML forecast returned no results for Vendor={pair.VendorId}, Product={pair.ProductId}");
                    continue;
                }

                for (int i = 0; i < mlResult.Forecast.Count; i++)
                {
                    DateTime nextDate =
                        granularity.Equals("Weekly", StringComparison.OrdinalIgnoreCase)
                            ? forecastStartDate.Date.AddDays(7 * i)
                            : forecastStartDate.Date.AddDays(i);

                    decimal qty = Math.Round(
                        Convert.ToDecimal(Math.Max(0, mlResult.Forecast[i])), 2);

                    allForecasts.Add(new DemandForecast
                    {
                        VendorId = pair.VendorId,
                        ProductId = pair.ProductId,
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
                    $"ML forecast failed for Vendor={pair.VendorId}, Product={pair.ProductId}. Error={ex.Message}");
            }
        }

        Console.WriteLine($"Total ML forecasts generated for farmer {farmerId}: {allForecasts.Count}");
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
    // 4) FORECAST ROWS FOR UI
    // =========================================================
    public async Task<List<DemandForecastRowDto>> GetForecastRowsAsync(DateTime forecastDate, string modelName)
    {
        var rows = await _db.DemandForecast
            .AsNoTracking()
            .Include(f => f.Product)
            .Include(f => f.Vendor)
            .Where(f => f.ForecastDate == forecastDate.Date && f.ModelName == modelName)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new DemandForecastRowDto
            {
                DemandForecastId = f.DemandForecastId,
                VendorId = f.VendorId,
                VendorName = f.Vendor.DisplayName,
                ProductId = f.ProductId,
                ProductName = f.Product.Name,
                ForecastDate = f.ForecastDate,
                ForecastQty = f.ForecastQty,
                ModelName = f.ModelName,
                LookbackPeriods = f.LookbackPeriods,
                CreatedAt = f.CreatedAt
            })
            .ToListAsync();

        return rows;
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

        history = history.OrderBy(x => x.Date).ToList();

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
    // 6) FILTERED VENDOR OPTIONS FOR FARMER
    // =========================================================
    public async Task<List<ForecastVendorOptionDto>> GetForecastVendorsForFarmerAsync(string farmerId, string? search = null)
    {
        var availableProductIds = await _db.InventoryLot
            .AsNoTracking()
            .Where(i =>
                i.FarmerId == farmerId &&
                i.QuantityAvailable > 0 &&
                i.Product.IsActive)
            .Select(i => i.ProductId)
            .Distinct()
            .ToListAsync();

        if (availableProductIds.Count == 0)
            return new List<ForecastVendorOptionDto>();

        var query = _db.DemandRequest
            .AsNoTracking()
            .Where(r => availableProductIds.Contains(r.ProductId))
            .Select(r => r.Vendor)
            .Distinct();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(v =>
                (v.DisplayName != null && v.DisplayName.ToLower().Contains(term)) ||
                (v.Email != null && v.Email.ToLower().Contains(term)));
        }

        return await query
            .OrderBy(v => v.DisplayName)
            .Select(v => new ForecastVendorOptionDto
            {
                Id = v.Id,
                DisplayName = v.DisplayName ?? "",
                Email = v.Email ?? ""
            })
            .ToListAsync();
    }

    // =========================================================
    // 7) FILTERED PRODUCT OPTIONS FOR FARMER
    // =========================================================
    public async Task<List<ForecastProductOptionDto>> GetForecastProductsForFarmerAsync(string farmerId, string? search = null)
    {
        var query = _db.InventoryLot
            .AsNoTracking()
            .Where(i =>
                i.FarmerId == farmerId &&
                i.QuantityAvailable > 0 &&
                i.Product.IsActive)
            .Select(i => i.Product)
            .Distinct();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term));
        }

        return await query
            .OrderBy(p => p.Name)
            .Select(p => new ForecastProductOptionDto
            {
                ProductId = p.ProductId,
                Name = p.Name,
                DefaultUnit = p.DefaultUnit
            })
            .ToListAsync();
    }

    // =========================================================
    // 8) PRIVATE HELPER FOR DAILY / WEEKLY SERIES
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