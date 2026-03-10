using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Services;

public class DispatchOptimizationService
{
    private readonly AppDbContext _db;

    public DispatchOptimizationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<RecommendedDispatchPlan>> RunGreedyOptimizationAsync(DateTime planDate)
    {
        // 1. Load forecasts for the selected date
        var forecasts = await _db.DemandForecast
            .AsNoTracking()
            .Where(f => f.ForecastDate.Date == planDate.Date)
            .OrderByDescending(f => f.ForecastQty) // prioritize higher demand first
            .ToListAsync();

        // 2. Load available inventory
        var inventoryLots = await _db.InventoryLot
            .AsNoTracking()
            .Where(l => l.QuantityAvailable > 0)
            .OrderBy(l => l.ExpiryDate ?? DateTime.MaxValue) // expiring stock first
            .ThenByDescending(l => l.QuantityAvailable)
            .ToListAsync();

        // this work on a mutable copy
        var inventoryPool = inventoryLots
            .Select(l => new InventoryAllocationItem
            {
                InventoryLotId = l.InventoryLotId,
                FarmerId = l.FarmerId,
                ProductId = l.ProductId,
                RemainingQty = l.QuantityAvailable,
                ExpiryDate = l.ExpiryDate
            })
            .ToList();

        var plans = new List<RecommendedDispatchPlan>();

        // 3. For each forecast, allocate stock greedily
        foreach (var forecast in forecasts)
        {
            decimal remainingDemand = forecast.ForecastQty;

            var candidateLots = inventoryPool
                .Where(i => i.ProductId == forecast.ProductId && i.RemainingQty > 0)
                .OrderBy(i => i.ExpiryDate ?? DateTime.MaxValue)
                .ThenByDescending(i => i.RemainingQty)
                .ToList();

            foreach (var lot in candidateLots)
            {
                if (remainingDemand <= 0) break;

                var allocated = Math.Min(remainingDemand, lot.RemainingQty);
                if (allocated <= 0) continue;

                plans.Add(new RecommendedDispatchPlan
                {
                    FarmerId = lot.FarmerId,
                    VendorId = forecast.VendorId,
                    ProductId = forecast.ProductId,
                    RecommendedQty = Math.Round(allocated, 2),
                    PlanDate = planDate.Date,
                    Algorithm = "GreedyBaseline",
                    CreatedAt = DateTime.UtcNow
                });

                lot.RemainingQty -= allocated;
                remainingDemand -= allocated;
            }
        }

        return plans;
    }

    public async Task<int> SavePlansAsync(List<RecommendedDispatchPlan> plans, DateTime planDate)
    {
        // Remove existing plans for same date and algorithm
        var existing = await _db.RecommendedDispatchPlan
            .Where(p => p.PlanDate.Date == planDate.Date && p.Algorithm == "GreedyBaseline")
            .ToListAsync();

        if (existing.Count > 0)
            _db.RecommendedDispatchPlan.RemoveRange(existing);

        if (plans.Count > 0)
            await _db.RecommendedDispatchPlan.AddRangeAsync(plans);

        return await _db.SaveChangesAsync();
    }

    private class InventoryAllocationItem
    {
        public int InventoryLotId { get; set; }
        public string FarmerId { get; set; } = "";
        public int ProductId { get; set; }
        public decimal RemainingQty { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }
}