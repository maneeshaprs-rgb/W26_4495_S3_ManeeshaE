using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[Route("api/vendor/demandrequests")]
[ApiController]
[Authorize(Roles = "Vendor")]
public class VendorDemandRequestsController : ControllerBase
{
    private readonly AppDbContext _db;

    public VendorDemandRequestsController(AppDbContext db)
    {
        _db = db;
    }

    // Helper: get VendorId (string based on your DTO)
    private string GetVendorId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
    }

    // ---------------------------------------------------------
    // 1️ CREATE DEMAND REQUEST (Vendor)
    // ---------------------------------------------------------
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FarmerDemandRequestRowDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var vendorId = GetVendorId();

        var demand = new DemandRequest
        {
            ProductId = dto.ProductId,
            VendorId = vendorId,
            Quantity = dto.Qty,
            NeededBy = dto.NeededBy,
            Status = "Open"
        };

        _db.DemandRequests.Add(demand);
        await _db.SaveChangesAsync();

        // Return in SAME DTO FORMAT
        var result = await _db.DemandRequests
            .Where(d => d.Id == demand.Id)
            .Include(d => d.Product)
            .Include(d => d.Vendor)
            .Select(d => new FarmerDemandRequestRowDto
            {
                DemandRequestId = d.Id,
                ProductId = d.ProductId,
                Product = d.Product.Name,
                Qty = d.Quantity,
                Unit = d.Product.Unit,
                NeededBy = d.NeededBy,
                Status = d.Status,
                VendorId = d.VendorId,
                VendorName = d.Vendor.DisplayName,
                VendorEmail = d.Vendor.Email
            })
            .FirstAsync();

        return Ok(result);
    }

    // ---------------------------------------------------------
    // 2️ GET MY DEMAND REQUESTS (Vendor)
    // ---------------------------------------------------------
    [HttpGet("mine")]
    public async Task<ActionResult<List<FarmerDemandRequestRowDto>>> GetMine()
    {
        var vendorId = GetVendorId();

        var list = await _db.DemandRequests
            .Where(d => d.VendorId == vendorId)
            .Include(d => d.Product)
            .Include(d => d.Vendor)
            .OrderByDescending(d => d.NeededBy)
            .Select(d => new FarmerDemandRequestRowDto
            {
                DemandRequestId = d.Id,
                ProductId = d.ProductId,
                Product = d.Product.Name,
                Qty = d.Quantity,
                Unit = d.Product.Unit,
                NeededBy = d.NeededBy,
                Status = d.Status,
                VendorId = d.VendorId,
                VendorName = d.Vendor.DisplayName,
                VendorEmail = d.Vendor.Email
            })
            .ToListAsync();

        return Ok(list);
    }
}