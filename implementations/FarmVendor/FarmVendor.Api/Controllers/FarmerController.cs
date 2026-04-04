using FarmVendor.Api.Data;
using FarmVendor.Api.Models.DTOs;
using FarmVendor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/farmer")]
[Authorize] // requires JWT
public class FarmerController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly FarmerRecommendationService _recommendationService;

    public FarmerController(AppDbContext db, FarmerRecommendationService recommendationService)
    {
        _db = db;
        _recommendationService = recommendationService;
    }

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier)
           ?? User.FindFirstValue("sub")
           ?? "";

    // 1) Stats for dashboard
    [HttpGet("dashboard/stats")]
    public async Task<IActionResult> GetStats()
    {
        var farmerId = GetUserId();
        if (string.IsNullOrEmpty(farmerId)) return Unauthorized();

        var now = DateTime.UtcNow;
        var soon = now.AddDays(7);

        var availableProducts = await _db.InventoryLot
            .Where(l => l.FarmerId == farmerId && l.QuantityAvailable > 0)
            .Select(l => l.ProductId)
            .Distinct()
            .CountAsync();

        var expiringSoon = await _db.InventoryLot
            .Where(l => l.FarmerId == farmerId && l.ExpiryDate != null && l.ExpiryDate <= soon)
            .CountAsync();

        var upcomingRequests = await _db.DemandRequest
            .Where(r => r.Status == "Open" && r.NeededBy >= now)
            .CountAsync();

        return Ok(new
        {
            availableProducts,
            expiringSoon,
            upcomingRequests
        });
    }

    // 2) Current stock table
    [HttpGet("dashboard/stock")]
    public async Task<IActionResult> GetStock()
    {
        var farmerId = GetUserId();
        if (string.IsNullOrEmpty(farmerId)) return Unauthorized();

        var rows = await _db.InventoryLot
            .Where(l => l.FarmerId == farmerId)
            .Include(l => l.Product)
            .OrderBy(l => l.ExpiryDate == null)
            .ThenBy(l => l.ExpiryDate)
            .Take(10)
            .Select(l => new
            {
                product = l.Product.Name,
                imageUrl = l.Product.ImageUrl,
                imageThumbUrl = l.Product.ImageThumbUrl,
                qty = l.QuantityAvailable,
                unit = l.Unit,
                expiry = l.ExpiryDate
            })
            .ToListAsync();

        return Ok(rows);
    }

    // 3) Upcoming vendor requests table
   [HttpGet("dashboard/requests")]
public async Task<IActionResult> GetRequests()
{
    var farmerId = GetUserId();
    if (string.IsNullOrEmpty(farmerId)) return Unauthorized();

    var now = DateTime.UtcNow;

    var farmer = await _db.Users
        .AsNoTracking()
        .FirstOrDefaultAsync(x => x.Id == farmerId);

    if (farmer == null) return Unauthorized();

    var rowsRaw = await _db.DemandRequest
        .AsNoTracking()
        .Where(r => r.Status == "Open" && r.NeededBy >= now)
        .Include(r => r.Product)
        .Include(r => r.Vendor)
        .OrderBy(r => r.NeededBy)
        .Take(10)
        .ToListAsync();

    var rows = rowsRaw.Select(r =>
    {
        double? distanceKm = null;

        if (farmer.Latitude.HasValue && farmer.Longitude.HasValue &&
            r.Vendor != null &&
            r.Vendor.Latitude.HasValue && r.Vendor.Longitude.HasValue)
        {
            distanceKm = CalculateDistanceKm(
                (double)farmer.Latitude.Value,
                (double)farmer.Longitude.Value,
                (double)r.Vendor.Latitude.Value,
                (double)r.Vendor.Longitude.Value
            );
        }

        return new FarmerDemandRequestRowDto
        {
            DemandRequestId = r.DemandRequestId,
            ProductId = r.ProductId,
            Product = r.Product.Name,
            ImageUrl = r.Product.ImageUrl,
            ImageThumbUrl = r.Product.ImageThumbUrl,
            Qty = r.QuantityRequested,
            Unit = r.Unit,
            NeededBy = r.NeededBy,
            Status = r.Status,
            VendorId = r.VendorId,
            VendorName = r.Vendor?.DisplayName,
            VendorEmail = r.Vendor?.Email,
            VendorCity = r.Vendor?.City,
            VendorProvince = r.Vendor?.Province,
            VendorPostalCode = r.Vendor?.PostalCode,
            DistanceToVendor = distanceKm.HasValue ? Math.Round(distanceKm.Value, 2) : null
        };
    }).ToList();

    return Ok(rows);
}

    // 4) My Inventory Lots (farmer)
    [HttpGet("inventorylots")]
    public async Task<IActionResult> GetMyInventoryLots()
    {
        var farmerId = GetUserId();
        if (string.IsNullOrEmpty(farmerId)) return Unauthorized();

        var rows = await _db.InventoryLot
            .Where(l => l.FarmerId == farmerId)
            .Include(l => l.Product)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new InventoryLotRowDto
            {
                InventoryLotId = l.InventoryLotId,
                ProductId = l.ProductId,
                ProductName = l.Product.Name,
                QuantityAvailable = l.QuantityAvailable,
                Unit = l.Unit,
                ExpiryDate = l.ExpiryDate,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    // 5) Update a lot (farmer owns it)
    [HttpPut("inventorylots/{id:int}")]
    public async Task<IActionResult> UpdateMyInventoryLot(int id, [FromBody] UpdateInventoryLotDto dto)
    {
        var farmerId = GetUserId();
        if (string.IsNullOrEmpty(farmerId)) return Unauthorized();

        if (dto.QuantityAvailable < 0)
            return BadRequest("QuantityAvailable cannot be negative.");

        var lot = await _db.InventoryLot
            .FirstOrDefaultAsync(l => l.InventoryLotId == id && l.FarmerId == farmerId);

        if (lot == null)
            return NotFound("Inventory lot not found.");

        lot.QuantityAvailable = dto.QuantityAvailable;

        if (!string.IsNullOrWhiteSpace(dto.Unit))
            lot.Unit = dto.Unit.Trim();

        lot.ExpiryDate = dto.ExpiryDate;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Updated", lot.InventoryLotId });
    }

    // 6) Delete a lot (farmer owns it)
    [HttpDelete("inventorylots/{id:int}")]
    public async Task<IActionResult> DeleteMyInventoryLot(int id)
    {
        var farmerId = GetUserId();
        if (string.IsNullOrEmpty(farmerId)) return Unauthorized();

        var lot = await _db.InventoryLot
            .FirstOrDefaultAsync(l => l.InventoryLotId == id && l.FarmerId == farmerId);

        if (lot == null)
            return NotFound("Inventory lot not found.");

        _db.InventoryLot.Remove(lot);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Deleted", id });
    }

    // 7) Open requests (for farmers to dispatch)
    [HttpGet("requests/open")]
    public async Task<IActionResult> GetOpenRequests()
    {
        var now = DateTime.UtcNow;

        var rows = await _db.DemandRequest
            .Where(r => r.Status == "Open" && r.NeededBy >= now)
            .Include(r => r.Product)
            .Include(r => r.Vendor)
            .OrderBy(r => r.NeededBy)
            .Select(r => new FarmerDemandRequestRowDto
            {
                DemandRequestId = r.DemandRequestId,
                ProductId = r.ProductId,
                Product = r.Product.Name,
                ImageUrl = r.Product.ImageUrl,
                ImageThumbUrl = r.Product.ImageThumbUrl,
                Qty = r.QuantityRequested,
                Unit = r.Unit,
                NeededBy = r.NeededBy,
                Status = r.Status,
                VendorId = r.VendorId,
                VendorName = r.Vendor != null ? r.Vendor.DisplayName : null,
                VendorEmail = r.Vendor != null ? r.Vendor.Email : null
            })
            .ToListAsync();

        return Ok(rows);
    }

    // 8) Requests history
    [HttpGet("requests/history")]
    public async Task<IActionResult> GetRequestHistory()
    {
        var rows = await _db.DemandRequest
            .Where(r => r.Status != "Open")
            .Include(r => r.Product)
            .Include(r => r.Vendor)
            .OrderByDescending(r => r.NeededBy)
            .Take(50)
            .Select(r => new FarmerDemandRequestRowDto
            {
                DemandRequestId = r.DemandRequestId,
                ProductId = r.ProductId,
                Product = r.Product.Name,
                Qty = r.QuantityRequested,
                Unit = r.Unit,
                NeededBy = r.NeededBy,
                Status = r.Status,
                VendorId = r.VendorId,
                VendorName = r.Vendor != null ? r.Vendor.DisplayName : null,
                VendorEmail = r.Vendor != null ? r.Vendor.Email : null
            })
            .ToListAsync();

        return Ok(rows);
    }

    // 9) Top recommended vendors for logged-in farmer
    [HttpGet("recommended-vendors")]
    public async Task<IActionResult> GetRecommendedVendors([FromQuery] DateTime? forecastDate)
    {
        var farmerId = GetUserId();

        if (string.IsNullOrWhiteSpace(farmerId))
            return Unauthorized();

        var date = forecastDate?.Date ?? DateTime.UtcNow.Date;

        var rows = await _recommendationService.GetTopVendorsForFarmerAsync(farmerId, date);
        return Ok(rows);
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