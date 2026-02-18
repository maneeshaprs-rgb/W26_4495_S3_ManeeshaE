using FarmVendor.Api.Data;
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

    public FarmerController(AppDbContext db)
    {
        _db = db;
    }

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

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
            .OrderBy(l => l.ExpiryDate == null) // expiry first, null last
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
                product = r.Product.Name,
                qty = r.QuantityRequested,
                unit = r.Unit,
                neededBy = r.NeededBy
            })
            .ToListAsync();

        return Ok(rows);
    }
}
