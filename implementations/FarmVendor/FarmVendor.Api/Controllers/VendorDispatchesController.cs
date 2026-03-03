using FarmVendor.Api.Data;
using FarmVendor.Api.Models.DTOs;
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

    public VendorDispatchesController(AppDbContext db)
    {
        _db = db;
    }

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

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

        // Security: vendor can only confirm their own dispatch
        if (dispatch.VendorId != vendorId) return Forbid();

        // Business rules
        if (dispatch.DeliveryStatus == "Cancelled")
            return BadRequest("Cancelled dispatch cannot be confirmed.");

        // You can enforce InTransit -> Delivered if you want:
        // if (dispatch.DeliveryStatus != "InTransit")
        //     return BadRequest($"Dispatch must be InTransit. Current: {dispatch.DeliveryStatus}");

        dispatch.DeliveryStatus = "Delivered";

        // Optional: update related demand request status
        if (dispatch.DemandRequest != null)
        {
            dispatch.DemandRequest.Status = "Fulfilled"; // or "Closed"
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            dispatch.DispatchId,
            dispatch.DeliveryStatus,
            dispatch.DispatchDate
        });
    }
}