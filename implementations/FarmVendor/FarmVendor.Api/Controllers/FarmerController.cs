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
        var now = DateTime.UtcNow;

        var rows = await _db.DemandRequest
            .Where(r => r.Status == "Open" && r.NeededBy >= now)
            .Include(r => r.Product)
            .OrderBy(r => r.NeededBy)
            .Take(10)
            .Select(r => new
            {
                demandRequestId = r.DemandRequestId,
                product = r.Product.Name,
                qty = r.QuantityRequested,
                unit = r.Unit,
                neededBy = r.NeededBy
            })
            .ToListAsync();

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
}