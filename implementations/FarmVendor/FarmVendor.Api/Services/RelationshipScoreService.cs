using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Services;

public class RelationshipScoreService
{
    private readonly AppDbContext _db;

    public RelationshipScoreService(AppDbContext db)
    {
        _db = db;
    }

    public async Task UpdateRelationshipScoreAsync(string farmerId, string vendorId)
    {
        if (string.IsNullOrWhiteSpace(farmerId) || string.IsNullOrWhiteSpace(vendorId))
            return;

        // All dispatches between this farmer and vendor
        var dispatches = await _db.Dispatch
            .AsNoTracking()
            .Include(d => d.DemandRequest)
            .Where(d => d.FarmerId == farmerId && d.VendorId == vendorId)
            .ToListAsync();

        if (dispatches.Count == 0)
            return;

        int totalDispatches = dispatches.Count;
        int deliveredCount = dispatches.Count(d => d.DeliveryStatus == "Delivered");
        int cancelledCount = dispatches.Count(d => d.DeliveryStatus == "Cancelled");

        int onTimeDeliveredCount = dispatches.Count(d =>
            d.DeliveryStatus == "Delivered" &&
            d.DemandRequest != null &&
            d.DispatchDate <= d.DemandRequest.NeededBy);

        decimal totalRequestedQty = dispatches
            .Where(d => d.DemandRequest != null)
            .Sum(d => d.DemandRequest!.QuantityRequested);

        decimal totalDeliveredQty = dispatches
            .Where(d => d.DeliveryStatus == "Delivered")
            .Sum(d => d.QuantityDispatched);

        decimal onTimeRate = deliveredCount == 0
            ? 0
            : (decimal)onTimeDeliveredCount / deliveredCount;

        decimal fulfillmentRate = totalRequestedQty == 0
            ? 0
            : totalDeliveredQty / totalRequestedQty;

        decimal cancellationRate = totalDispatches == 0
            ? 0
            : (decimal)cancelledCount / totalDispatches;

        // Weighted score out of 100
        // need to adjust weights later for experiments
        decimal score =
            (onTimeRate * 50m) +         // 50%
            (fulfillmentRate * 40m) +    // 40%
            ((1 - cancellationRate) * 10m); // 10%

        score = Math.Round(score, 2);

        var existing = await _db.RelationshipStat
            .FirstOrDefaultAsync(r => r.FarmerId == farmerId && r.VendorId == vendorId);

        if (existing == null)
        {
            existing = new RelationshipStat
            {
                FarmerId = farmerId,
                VendorId = vendorId
            };
            _db.RelationshipStat.Add(existing);
        }

        existing.TotalDispatches = totalDispatches;
        existing.DeliveredCount = deliveredCount;
        existing.CancelledCount = cancelledCount;
        existing.OnTimeDeliveredCount = onTimeDeliveredCount;
        existing.TotalRequestedQty = Math.Round(totalRequestedQty, 2);
        existing.TotalDeliveredQty = Math.Round(totalDeliveredQty, 2);
        existing.RelationshipScore = score;
        existing.LastUpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }
}