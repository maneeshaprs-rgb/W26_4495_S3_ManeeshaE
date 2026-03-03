using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/dispatches")]
[Authorize]
public class DispatchesController : ControllerBase
{
    private readonly AppDbContext _db;

    public DispatchesController(AppDbContext db)
    {
        _db = db;
    }

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    [HttpPost]
    public async Task<IActionResult> CreateDispatch([FromBody] CreateDispatchDto dto)
    {
        var farmerId = GetUserId();
        if (string.IsNullOrEmpty(farmerId)) return Unauthorized();

        if (dto.DemandRequestId <= 0) return BadRequest("DemandRequestId is required.");
        if (dto.QuantityDispatched <= 0) return BadRequest("QuantityDispatched must be greater than 0.");

        // Load demand request + product + vendor
        var req = await _db.DemandRequest
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.DemandRequestId == dto.DemandRequestId);

        if (req == null) return NotFound("Demand request not found.");

        if (req.Status != "Open")
            return BadRequest($"Demand request is not Open. Current status: {req.Status}");

        // (Optional but recommended) ensure farmer has inventory for this product
        var availableQty = await _db.InventoryLot
            .Where(l => l.FarmerId == farmerId && l.ProductId == req.ProductId)
            .SumAsync(l => l.QuantityAvailable);

        if (availableQty < dto.QuantityDispatched)
            return BadRequest($"Not enough stock. Available: {availableQty}, Requested dispatch: {dto.QuantityDispatched}");

        var dispatch = new Dispatch
        {
            DemandRequestId = req.DemandRequestId,
            FarmerId = farmerId,
            VendorId = req.VendorId,
            ProductId = req.ProductId,
            QuantityDispatched = dto.QuantityDispatched,
            Unit = string.IsNullOrWhiteSpace(req.Unit) ? "kg" : req.Unit,
            DispatchDate = dto.DispatchDate ?? DateTime.UtcNow,
            DeliveryStatus = "Planned",
            CreatedAt = DateTime.UtcNow
        };

        _db.Dispatch.Add(dispatch);

        // update request status (you can decide the workflow)
        // Common flow: Open -> Accepted (dispatch created) -> Fulfilled (delivered)
        req.Status = "Accepted";

        await _db.SaveChangesAsync();

        return Ok(new
        {
            dispatch.DispatchId,
            dispatch.DemandRequestId,
            dispatch.FarmerId,
            dispatch.VendorId,
            dispatch.ProductId,
            dispatch.QuantityDispatched,
            dispatch.Unit,
            dispatch.DispatchDate,
            dispatch.DeliveryStatus
        });
    }
}