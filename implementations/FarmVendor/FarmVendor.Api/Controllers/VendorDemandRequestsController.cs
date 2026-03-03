using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/vendor/demandrequests")]
[Authorize] // JWT required
public class VendorDemandRequestsController : ControllerBase
{
    private readonly AppDbContext _db;

    public VendorDemandRequestsController(AppDbContext db)
    {
        _db = db;
    }

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    // GET: api/vendor/demandrequests?status=Open
    [HttpGet]
    public async Task<IActionResult> GetMyDemandRequests([FromQuery] string? status = null)
    {
        var vendorId = GetUserId();
        if (string.IsNullOrEmpty(vendorId)) return Unauthorized();

        var q = _db.DemandRequest
            .AsNoTracking()
            .Where(r => r.VendorId == vendorId)
            .Include(r => r.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(r => r.Status == status);

        var rows = await q
            .OrderByDescending(r => r.CreatedAt)
            .Take(100)
            .Select(r => new FarmerDemandRequestRowDto
            {
                DemandRequestId = r.DemandRequestId,
                ProductId = r.ProductId,
                Product = r.Product.Name,
                Qty = r.QuantityRequested,
                Unit = r.Unit,
                NeededBy = r.NeededBy,
                Status = r.Status
            })
            .ToListAsync();

        return Ok(rows);
    }

    // POST: api/vendor/demandrequests
    [HttpPost]
    public async Task<IActionResult> CreateDemandRequest([FromBody] CreateDemandRequestDto dto)
    {
        var vendorId = GetUserId();
        if (string.IsNullOrEmpty(vendorId)) return Unauthorized();

        if (dto.ProductId <= 0) return BadRequest("ProductId is required.");
        if (dto.QuantityRequested <= 0) return BadRequest("QuantityRequested must be > 0.");
        if (dto.NeededBy == default) return BadRequest("NeededBy is required.");

        var product = await _db.Product
            .FirstOrDefaultAsync(p => p.ProductId == dto.ProductId && p.IsActive);

        if (product == null) return NotFound("Product not found or inactive.");

        var unit = !string.IsNullOrWhiteSpace(dto.Unit) ? dto.Unit!.Trim() : (product.DefaultUnit ?? "kg");

        var req = new DemandRequest
        {
            VendorId = vendorId,
            ProductId = dto.ProductId,
            QuantityRequested = dto.QuantityRequested,
            Unit = unit,
            NeededBy = dto.NeededBy,
            Status = "Open",
            CreatedAt = DateTime.UtcNow
        };

        _db.DemandRequest.Add(req);
        await _db.SaveChangesAsync();

        // Return a row (good for UI immediately)
        return Ok(new FarmerDemandRequestRowDto
        {
            DemandRequestId = req.DemandRequestId,
            ProductId = req.ProductId,
            Product = product.Name,
            Qty = req.QuantityRequested,
            Unit = req.Unit,
            NeededBy = req.NeededBy,
            Status = req.Status
        });
    }
}