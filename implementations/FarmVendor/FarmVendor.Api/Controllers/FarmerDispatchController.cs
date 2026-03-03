using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/farmer/dispatches")]
[Authorize]
public class FarmerDispatchController : ControllerBase
{
    private readonly AppDbContext _db;

    public FarmerDispatchController(AppDbContext db)
    {
        _db = db;
    }

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    // GET: api/farmer/dispatches?status=Planned|InTransit|Delivered|Cancelled
    [HttpGet]
public async Task<IActionResult> GetMyDispatches([FromQuery] string? status = null)
{
    var farmerId = GetUserId();
    if (string.IsNullOrEmpty(farmerId)) return Unauthorized();

    // IMPORTANT: force it to IQueryable<Dispatch>
    IQueryable<Dispatch> query = _db.Dispatch
        .Where(d => d.FarmerId == farmerId)
        .Include(d => d.Product)
        .Include(d => d.Vendor);

    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(d => d.DeliveryStatus == status);
    }

    var rows = await query
        .OrderByDescending(d => d.CreatedAt)
        .Take(100)
        .Select(d => new DispatchRowDto
        {
            DispatchId = d.DispatchId,
            DemandRequestId = d.DemandRequestId,
            ProductId = d.ProductId,
            Product = d.Product.Name,
            VendorId = d.VendorId,
            VendorName = d.Vendor.DisplayName,
            VendorEmail = d.Vendor.Email,
            QuantityDispatched = d.QuantityDispatched,
            Unit = d.Unit,
            DispatchDate = d.DispatchDate,
            DeliveryStatus = d.DeliveryStatus,
            CreatedAt = d.CreatedAt
        })
        .ToListAsync();

    return Ok(rows);
}

    // PATCH: api/farmer/dispatches/{dispatchId}/status
    [HttpPatch("{dispatchId:int}/status")]
    public async Task<IActionResult> UpdateStatus(int dispatchId, [FromBody] UpdateDispatchStatusDto dto)
    {
        var farmerId = GetUserId();
        if (string.IsNullOrEmpty(farmerId)) return Unauthorized();

        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Planned", "InTransit", "Delivered", "Cancelled"
        };

        if (dto == null || string.IsNullOrWhiteSpace(dto.DeliveryStatus))
            return BadRequest("DeliveryStatus is required.");

        if (!allowed.Contains(dto.DeliveryStatus))
            return BadRequest("Invalid DeliveryStatus. Allowed: Planned, InTransit, Delivered, Cancelled");

        var dispatch = await _db.Dispatch.FirstOrDefaultAsync(d => d.DispatchId == dispatchId && d.FarmerId == farmerId);
        if (dispatch == null) return NotFound("Dispatch not found.");

        // Simple status transition rule (optional)
        // Planned -> InTransit -> Delivered; Cancelled anytime (except after Delivered)
        if (dispatch.DeliveryStatus.Equals("Delivered", StringComparison.OrdinalIgnoreCase) &&
            !dto.DeliveryStatus.Equals("Delivered", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Delivered dispatch cannot be changed.");
        }

        if (dispatch.DeliveryStatus.Equals("Cancelled", StringComparison.OrdinalIgnoreCase) &&
            !dto.DeliveryStatus.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Cancelled dispatch cannot be changed.");
        }

        dispatch.DeliveryStatus = dto.DeliveryStatus;

        // Optional: if Delivered, mark related demand request as Fulfilled
        if (dispatch.DeliveryStatus.Equals("Delivered", StringComparison.OrdinalIgnoreCase) && dispatch.DemandRequestId != null)
        {
            var req = await _db.DemandRequest.FirstOrDefaultAsync(r => r.DemandRequestId == dispatch.DemandRequestId);
            if (req != null && req.Status != "Cancelled")
            {
                req.Status = "Fulfilled";
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new { dispatch.DispatchId, dispatch.DeliveryStatus });
    }
}