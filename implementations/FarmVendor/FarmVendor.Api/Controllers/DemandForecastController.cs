using FarmVendor.Api.Data;
using FarmVendor.Api.Models.DTOs;
using FarmVendor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/forecasts")]
[Authorize]
public class DemandForecastController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly DemandForecastService _forecastService;

    public DemandForecastController(AppDbContext db, DemandForecastService forecastService)
    {
        _db = db;
        _forecastService = forecastService;
    }

    // POST: /api/forecasts/generate
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateForecasts([FromBody] GenerateForecastDto dto)
    {
        if (dto.ForecastDate == default)
            return BadRequest("ForecastDate is required.");

        if (dto.LookbackPeriods <= 0)
            return BadRequest("LookbackPeriods must be greater than 0.");

        var forecasts = await _forecastService.GenerateMovingAverageForecastsAsync(
            dto.ForecastDate,
            dto.LookbackPeriods
        );

        var count = await _forecastService.SaveForecastsAsync(forecasts);

        return Ok(new
        {
            Message = "Forecast generation completed.",
            ForecastCount = forecasts.Count,
            SavedRows = count
        });
    }

    // GET: /api/forecasts?forecastDate=2026-03-10
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DemandForecastRowDto>>> GetForecasts([FromQuery] DateTime? forecastDate)
    {
        var query = _db.DemandForecast
            .AsNoTracking()
            .Include(f => f.Product)
            .AsQueryable();

        if (forecastDate.HasValue)
            query = query.Where(f => f.ForecastDate.Date == forecastDate.Value.Date);

        var rows = await query
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new DemandForecastRowDto
            {
                DemandForecastId = f.DemandForecastId,
                VendorId = f.VendorId,
                ProductId = f.ProductId,
                ProductName = f.Product.Name,
                ForecastDate = f.ForecastDate,
                ForecastQty = f.ForecastQty,
                ModelName = f.ModelName,
                LookbackPeriods = f.LookbackPeriods,
                CreatedAt = f.CreatedAt
            })
            .ToListAsync();

        return Ok(rows);
    }
}