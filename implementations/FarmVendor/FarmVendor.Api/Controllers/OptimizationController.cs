using FarmVendor.Api.Data;
using FarmVendor.Api.Models.DTOs;
using FarmVendor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/optimization")]
[Authorize]
public class OptimizationController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly DispatchOptimizationService _optimizationService;

    public OptimizationController(AppDbContext db, DispatchOptimizationService optimizationService)
    {
        _db = db;
        _optimizationService = optimizationService;
    }

    // POST: /api/optimization/run
    [HttpPost("run")]
    public async Task<IActionResult> RunOptimization([FromBody] RunOptimizationDto dto)
    {
        if (dto.PlanDate == default)
            return BadRequest("PlanDate is required.");

        var plans = await _optimizationService.RunGreedyOptimizationAsync(dto.PlanDate);
        var saved = await _optimizationService.SavePlansAsync(plans, dto.PlanDate);

        return Ok(new
        {
            Message = "Optimization completed successfully.",
            PlanCount = plans.Count,
            SavedRows = saved
        });
    }

    // GET: /api/optimization/plans?planDate=2026-03-10
    [HttpGet("plans")]
    public async Task<ActionResult<IEnumerable<RecommendedDispatchPlanRowDto>>> GetPlans([FromQuery] DateTime? planDate)
    {
        var query = _db.RecommendedDispatchPlan
            .AsNoTracking()
            .Include(p => p.Product)
            .Include(p => p.Farmer)
            .Include(p => p.Vendor)
            .AsQueryable();

        if (planDate.HasValue)
            query = query.Where(p => p.PlanDate.Date == planDate.Value.Date);

        var rows = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new RecommendedDispatchPlanRowDto
            {
                RecommendedDispatchPlanId = p.RecommendedDispatchPlanId,
                FarmerId = p.FarmerId,
                FarmerName = p.Farmer.DisplayName,
                VendorId = p.VendorId,
                VendorName = p.Vendor.DisplayName,
                ProductId = p.ProductId,
                ProductName = p.Product.Name,
                RecommendedQty = p.RecommendedQty,
                PlanDate = p.PlanDate,
                Algorithm = p.Algorithm,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }
}