using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using FarmVendor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/vendor/dispatches")]
[Authorize]
public class VendorDispatchesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly RelationshipScoreService _relationshipScoreService;

    public VendorDispatchesController(AppDbContext db, RelationshipScoreService relationshipScoreService)
    {
        _db = db;
        _relationshipScoreService = relationshipScoreService;
    }

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    // GET: /api/vendor/dispatches/incoming?status=Planned|InTransit
    [HttpGet("incoming")]
    public async Task<IActionResult> GetIncoming([FromQuery] string? status = null)
    {
        var vendorId = GetUserId();
        if (string.IsNullOrEmpty(vendorId)) return Unauthorized();

        IQueryable<Dispatch> query = _db.Dispatch
            .AsNoTracking()
            .Include(d => d.Product)
            .Include(d => d.Farmer)
            .Include(d => d.Vendor)
            .Where(d => d.VendorId == vendorId);

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(d => d.DeliveryStatus == status);
        }
        else
        {
            query = query.Where(d => d.DeliveryStatus != "Delivered" && d.DeliveryStatus != "Cancelled");
        }

        var rows = await query
            .OrderByDescending(d => d.CreatedAt)
            .Take(200)
            .Select(d => new DispatchRowDto
            {
                DispatchId = d.DispatchId,
                DemandRequestId = d.DemandRequestId,
                ProductId = d.ProductId,
                Product = d.Product.Name,
                VendorId = d.VendorId,
                QuantityDispatched = d.QuantityDispatched,
                Unit = d.Unit,
                DispatchDate = d.DispatchDate,
                DeliveryStatus = d.DeliveryStatus,
                CreatedAt = d.CreatedAt,
                VendorName = d.Vendor.DisplayName,
                VendorEmail = d.Vendor.Email,
            })
            .ToListAsync();

        return Ok(rows);
    }

    // POST: /api/vendor/dispatches/confirm
    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmDelivery([FromBody] VendorConfirmDeliveryDto dto)
    {
        var vendorId = GetUserId();
        if (string.IsNullOrEmpty(vendorId)) return Unauthorized();

        if (dto.DispatchId <= 0) return BadRequest("DispatchId is required.");

        var dispatch = await _db.Dispatch
            .Include(d => d.DemandRequest)
            .FirstOrDefaultAsync(d => d.DispatchId == dto.DispatchId);

        if (dispatch == null) return NotFound("Dispatch not found.");

        if (dispatch.VendorId != vendorId) return Forbid();

        if (dispatch.DeliveryStatus == "Cancelled")
            return BadRequest("Cancelled dispatch cannot be confirmed.");

        dispatch.DeliveryStatus = "Delivered";

        if (dispatch.DemandRequest != null)
        {
            dispatch.DemandRequest.Status = "Fulfilled";
        }

        await _db.SaveChangesAsync();

        await _relationshipScoreService.UpdateRelationshipScoreAsync(dispatch.FarmerId, dispatch.VendorId);

        return Ok(new
        {
            dispatch.DispatchId,
            dispatch.DeliveryStatus,
            dispatch.DispatchDate
        });
    }
}