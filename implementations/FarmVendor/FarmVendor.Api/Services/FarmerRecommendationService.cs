using FarmVendor.Api.Data;
using FarmVendor.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Services;

public class FarmerRecommendationService
{
    private readonly AppDbContext _db;

    public FarmerRecommendationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<RecommendedVendorRowDto>> GetTopVendorsForFarmerAsync(string farmerId, DateTime forecastDate)
    {
        var farmer = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == farmerId);

        if (farmer == null)
            return new List<RecommendedVendorRowDto>();

        var farmerInventory = await _db.InventoryLot
            .AsNoTracking()
            .Where(x => x.FarmerId == farmerId && x.QuantityAvailable > 0)
            .GroupBy(x => x.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                QuantityAvailable = g.Sum(x => x.QuantityAvailable)
            })
            .ToListAsync();

        if (!farmerInventory.Any())
            return new List<RecommendedVendorRowDto>();

        var inventoryMap = farmerInventory.ToDictionary(x => x.ProductId, x => x.QuantityAvailable);

        var forecasts = await _db.DemandForecast
            .AsNoTracking()
            .Include(x => x.Product)
            .Include(x => x.Vendor)
            .Where(x => x.ForecastDate.Date == forecastDate.Date && x.ModelName == "MLNET_SSA")
            .ToListAsync();

        var relationshipStats = await _db.RelationshipStat
            .AsNoTracking()
            .Where(x => x.FarmerId == farmerId)
            .ToListAsync();

        var relationshipMap = relationshipStats.ToDictionary(x => x.VendorId, x => x.RelationshipScore);

        var results = new List<RecommendedVendorRowDto>();

        var vendorGroups = forecasts.GroupBy(x => new { x.VendorId, VendorName = x.Vendor.DisplayName });

        foreach (var group in vendorGroups)
        {
            decimal totalForecastDemand = 0;
            decimal matchableQty = 0;
            int matchedProductCount = 0;
            var matchedProducts = new List<string>();

            foreach (var fc in group)
            {
                totalForecastDemand += fc.ForecastQty;

                if (inventoryMap.TryGetValue(fc.ProductId, out var availableQty))
                {
                    var matchedQty = Math.Min(availableQty, fc.ForecastQty);
                    if (matchedQty > 0)
                    {
                        matchableQty += matchedQty;
                        matchedProductCount++;
                        matchedProducts.Add(fc.Product.Name);
                    }
                }
            }

            if (matchableQty <= 0)
                continue;

            decimal relationshipScore = relationshipMap.TryGetValue(group.Key.VendorId, out var rel)
                ? rel
                : 50m;

            var vendor = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == group.Key.VendorId);
            double distanceKm = 999;

            if (vendor != null &&
                farmer.Latitude.HasValue && farmer.Longitude.HasValue &&
                vendor.Latitude.HasValue && vendor.Longitude.HasValue)
            {
                distanceKm = CalculateDistanceKm(
                    (double)farmer.Latitude.Value,
                    (double)farmer.Longitude.Value,
                    (double)vendor.Latitude.Value,
                    (double)vendor.Longitude.Value);
            }

            var demandMatchScore = totalForecastDemand == 0 ? 0 : (matchableQty / totalForecastDemand) * 100m;
            var distanceScore = distanceKm >= 999 ? 0m : (decimal)Math.Max(0, 100 - distanceKm);
            var productCoverageScore = matchedProductCount * 10m;

            var finalScore =
                (0.45m * demandMatchScore) +
                (0.25m * relationshipScore) +
                (0.20m * distanceScore) +
                (0.10m * productCoverageScore);

            results.Add(new RecommendedVendorRowDto
            {
                VendorId = group.Key.VendorId,
                VendorName = group.Key.VendorName ?? "Vendor",
                DistanceKm = Math.Round(distanceKm, 2),
                RelationshipScore = Math.Round(relationshipScore, 2),
                TotalForecastDemand = Math.Round(totalForecastDemand, 2),
                MatchableQuantity = Math.Round(matchableQty, 2),
                MatchedProductCount = matchedProductCount,
                FinalScore = Math.Round(finalScore, 2),
                MatchedProducts = matchedProducts.Distinct().ToList()
            });
        }

        return results
            .OrderByDescending(x => x.FinalScore)
            .Take(5)
            .ToList();
    }

    private static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        double R = 6371;
        double dLat = DegreesToRadians(lat2 - lat1);
        double dLon = DegreesToRadians(lon2 - lon1);

        double a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double DegreesToRadians(double deg) => deg * Math.PI / 180.0;
}