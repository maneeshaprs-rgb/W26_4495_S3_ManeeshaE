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

        if (string.IsNullOrWhiteSpace(dto.ModelName))
            dto.ModelName = "MovingAverage";

        List<Models.DemandForecast> forecasts;

        if (dto.ModelName.Equals("MovingAverage", StringComparison.OrdinalIgnoreCase))
        {
            if (dto.LookbackPeriods <= 0)
                return BadRequest("LookbackPeriods must be greater than 0.");

            forecasts = await _forecastService.GenerateMovingAverageForecastsAsync(
                dto.ForecastDate,
                dto.LookbackPeriods
            );
        }
        else if (dto.ModelName.Equals("MLNET_SSA", StringComparison.OrdinalIgnoreCase))
        {
            if (dto.Horizon <= 0)
                return BadRequest("Horizon must be greater than 0.");

            forecasts = await _forecastService.GenerateMlForecastsAsync(
                dto.ForecastDate,
                dto.Horizon,
                dto.Granularity ?? "Daily"
            );
        }
        else
        {
            return BadRequest("Unsupported modelName. Use 'MovingAverage' or 'MLNET_SSA'.");
        }

        var count = await _forecastService.SaveForecastsAsync(forecasts);

        return Ok(new
        {
            Message = "Forecast generation completed.",
            ModelName = dto.ModelName,
            ForecastCount = forecasts.Count,
            SavedRows = count
        });
    }

    // GET: /api/forecasts?forecastDate=2026-03-10&modelName=MLNET_SSA
    [HttpGet]
public async Task<ActionResult<IEnumerable<DemandForecastRowDto>>> GetForecasts(
    [FromQuery] DateTime? forecastDate,
    [FromQuery] string? modelName)
{
    var query = _db.DemandForecast
        .AsNoTracking()
        .Include(f => f.Product)
        .AsQueryable();

    if (forecastDate.HasValue)
        query = query.Where(f => f.ForecastDate.Date == forecastDate.Value.Date);

    if (!string.IsNullOrWhiteSpace(modelName))
    {
        var normalizedModelName = modelName.Trim().ToLower();
        query = query.Where(f => f.ModelName.ToLower() == normalizedModelName);
    }

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

    // GET: /api/forecasts/compare?vendorId=abc&productId=1&forecastDate=2026-03-10
    [HttpGet("compare")]
    public async Task<IActionResult> CompareForecasts(
        [FromQuery] string vendorId,
        [FromQuery] int productId,
        [FromQuery] DateTime forecastDate,
        [FromQuery] int lookbackPeriods = 3)
    {
        if (string.IsNullOrWhiteSpace(vendorId))
            return BadRequest("VendorId is required.");

        var result = await _forecastService.CompareForecastForPairAsync(
            vendorId,
            productId,
            forecastDate,
            lookbackPeriods);

        if (result == null)
            return NotFound("Not enough historical data to compare forecasts.");

        return Ok(result);
    }

    //check what model names actually exist in the table
    [HttpGet("models")]
public async Task<IActionResult> GetModelNames()
{
    var models = await _db.DemandForecast
        .AsNoTracking()
        .Select(f => f.ModelName)
        .Distinct()
        .ToListAsync();

    return Ok(models);
}
}