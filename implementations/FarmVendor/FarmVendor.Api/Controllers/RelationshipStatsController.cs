using FarmVendor.Api.Data;
using FarmVendor.Api.Models.DTOs;
using FarmVendor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/relationshipstats")]
[Authorize]
public class RelationshipStatsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly RelationshipScoreService _relationshipScoreService;

    public RelationshipStatsController(AppDbContext db, RelationshipScoreService relationshipScoreService)
    {
        _db = db;
        _relationshipScoreService = relationshipScoreService;
    }

    // GET: /api/relationshipstats
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RelationshipScoreRowDto>>> GetAll()
    {
        var rows = await _db.RelationshipStat
            .AsNoTracking()
            .Include(r => r.Farmer)
            .Include(r => r.Vendor)
            .OrderByDescending(r => r.RelationshipScore)
            .Select(r => new RelationshipScoreRowDto
            {
                RelationshipStatId = r.RelationshipStatId,
                FarmerId = r.FarmerId,
                FarmerName = r.Farmer.DisplayName,
                VendorId = r.VendorId,
                VendorName = r.Vendor.DisplayName,
                TotalDispatches = r.TotalDispatches,
                DeliveredCount = r.DeliveredCount,
                CancelledCount = r.CancelledCount,
                OnTimeDeliveredCount = r.OnTimeDeliveredCount,
                TotalRequestedQty = r.TotalRequestedQty,
                TotalDeliveredQty = r.TotalDeliveredQty,
                RelationshipScore = r.RelationshipScore,
                OnTimeRate = r.DeliveredCount == 0 ? 0 : Math.Round((decimal)r.OnTimeDeliveredCount / r.DeliveredCount, 2),
                FulfillmentRate = r.TotalRequestedQty == 0 ? 0 : Math.Round(r.TotalDeliveredQty / r.TotalRequestedQty, 2),
                CancellationRate = r.TotalDispatches == 0 ? 0 : Math.Round((decimal)r.CancelledCount / r.TotalDispatches, 2),
                LastUpdatedAt = r.LastUpdatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }

    // GET: /api/relationshipstats/by-pair?farmerId=...&vendorId=...
    [HttpGet("by-pair")]
    public async Task<ActionResult<RelationshipScoreRowDto>> GetByPair([FromQuery] string farmerId, [FromQuery] string vendorId)
    {
        var r = await _db.RelationshipStat
            .AsNoTracking()
            .Include(x => x.Farmer)
            .Include(x => x.Vendor)
            .FirstOrDefaultAsync(x => x.FarmerId == farmerId && x.VendorId == vendorId);

        if (r == null) return NotFound("Relationship stats not found.");

        return Ok(new RelationshipScoreRowDto
        {
            RelationshipStatId = r.RelationshipStatId,
            FarmerId = r.FarmerId,
            FarmerName = r.Farmer.DisplayName,
            VendorId = r.VendorId,
            VendorName = r.Vendor.DisplayName,
            TotalDispatches = r.TotalDispatches,
            DeliveredCount = r.DeliveredCount,
            CancelledCount = r.CancelledCount,
            OnTimeDeliveredCount = r.OnTimeDeliveredCount,
            TotalRequestedQty = r.TotalRequestedQty,
            TotalDeliveredQty = r.TotalDeliveredQty,
            RelationshipScore = r.RelationshipScore,
            OnTimeRate = r.DeliveredCount == 0 ? 0 : Math.Round((decimal)r.OnTimeDeliveredCount / r.DeliveredCount, 2),
            FulfillmentRate = r.TotalRequestedQty == 0 ? 0 : Math.Round(r.TotalDeliveredQty / r.TotalRequestedQty, 2),
            CancellationRate = r.TotalDispatches == 0 ? 0 : Math.Round((decimal)r.CancelledCount / r.TotalDispatches, 2),
            LastUpdatedAt = r.LastUpdatedAt
        });
    }

    // POST: /api/relationshipstats/recalculate?farmerId=...&vendorId=...
    [HttpPost("recalculate")]
    public async Task<IActionResult> Recalculate([FromQuery] string farmerId, [FromQuery] string vendorId)
    {
        await _relationshipScoreService.UpdateRelationshipScoreAsync(farmerId, vendorId);
        return Ok(new { message = "Relationship score recalculated." });
    }
}