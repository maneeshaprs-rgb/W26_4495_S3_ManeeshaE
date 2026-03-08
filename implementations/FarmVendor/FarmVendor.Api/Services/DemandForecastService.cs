using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Services;

public class DemandForecastService
{
    private readonly AppDbContext _db;

    public DemandForecastService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<DemandForecast>> GenerateMovingAverageForecastsAsync(DateTime forecastDate, int lookbackPeriods = 3)
    {
        if (lookbackPeriods <= 0)
            throw new ArgumentException("LookbackPeriods must be greater than 0.");

        // below Get historical demand requests grouped by VendorId + ProductId
        var groupedRequests = await _db.DemandRequest
            .AsNoTracking()
            .Where(r => r.CreatedAt < forecastDate)
            .OrderByDescending(r => r.CreatedAt)
            .GroupBy(r => new { r.VendorId, r.ProductId })
            .Select(g => new
            {
                g.Key.VendorId,
                g.Key.ProductId,
                Requests = g
                    .OrderByDescending(x => x.CreatedAt)
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

    public async Task<int> SaveForecastsAsync(List<DemandForecast> forecasts)
    {
        if (forecasts.Count == 0) return 0;

        //this is Optional: this is remove existing forecasts for same date/model/vendor/product
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
}