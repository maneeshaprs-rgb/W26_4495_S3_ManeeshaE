using FarmVendor.Api.Models.DTOs;
using FarmVendor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/forecasts")]
[Authorize]
public class DemandForecastController : ControllerBase
{
    private readonly DemandForecastService _forecastService;

    public DemandForecastController(DemandForecastService forecastService)
    {
        _forecastService = forecastService;
    }

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    // POST: /api/forecasts/generate
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateForecasts([FromBody] GenerateForecastDto dto)
    {
        var farmerId = GetUserId();
        if (string.IsNullOrWhiteSpace(farmerId))
            return Unauthorized();

        if (dto.ForecastDate == default)
            return BadRequest("ForecastDate is required.");

        if (string.IsNullOrWhiteSpace(dto.ModelName))
            dto.ModelName = "MLNET_SSA";

        List<FarmVendor.Api.Models.DemandForecast> forecasts;

        if (dto.ModelName.Equals("MovingAverage", StringComparison.OrdinalIgnoreCase))
        {
            if (dto.LookbackPeriods <= 0)
                return BadRequest("LookbackPeriods must be greater than 0.");

            forecasts = await _forecastService.GenerateMovingAverageForecastsForFarmerAsync(
                farmerId,
                dto.ForecastDate,
                dto.LookbackPeriods
            );
        }
        else if (dto.ModelName.Equals("MLNET_SSA", StringComparison.OrdinalIgnoreCase))
        {
            if (dto.Horizon <= 0)
                return BadRequest("Horizon must be greater than 0.");

            forecasts = await _forecastService.GenerateMlForecastsForFarmerAsync(
                farmerId,
                dto.ForecastDate,
                dto.Horizon,
                dto.Granularity ?? "Daily"
            );
        }
        else
        {
            return BadRequest("Unsupported modelName. Use 'MovingAverage' or 'MLNET_SSA'.");
        }

        var saved = await _forecastService.SaveForecastsAsync(forecasts);

        return Ok(new
        {
            message = "Forecast generation completed.",
            modelName = dto.ModelName,
            forecastCount = forecasts.Count,
            savedRows = saved
        });
    }

    // GET: /api/forecasts?forecastDate=2026-04-05&modelName=MLNET_SSA
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DemandForecastRowDto>>> GetForecasts(
        [FromQuery] DateTime? forecastDate,
        [FromQuery] string? modelName)
    {
        var requestedDate = forecastDate ?? DateTime.UtcNow.Date;
        var requestedModel = string.IsNullOrWhiteSpace(modelName)
            ? "MLNET_SSA"
            : modelName.Trim();

        var rows = await _forecastService.GetForecastRowsAsync(requestedDate, requestedModel);
        return Ok(rows);
    }

    // GET: /api/forecasts/chart?vendorId=abc&productId=1&forecastDate=2026-04-05&modelName=MLNET_SSA
    [HttpGet("chart")]
    public async Task<IActionResult> GetForecastChartData(
        [FromQuery] string vendorId,
        [FromQuery] int productId,
        [FromQuery] DateTime forecastDate,
        [FromQuery] string modelName = "MLNET_SSA")
    {
        if (string.IsNullOrWhiteSpace(vendorId))
            return BadRequest("VendorId is required.");

        if (productId <= 0)
            return BadRequest("ProductId is required.");

        if (forecastDate == default)
            return BadRequest("ForecastDate is required.");

        var data = await _forecastService.GetForecastChartDataAsync(
            vendorId,
            productId,
            forecastDate,
            modelName);

        return Ok(data);
    }

    // GET: /api/forecasts/vendors?search=vendor
    // Only vendors relevant to logged-in farmer's available products
    [HttpGet("vendors")]
    public async Task<IActionResult> GetVendors([FromQuery] string? search = null)
    {
        var farmerId = GetUserId();
        if (string.IsNullOrWhiteSpace(farmerId))
            return Unauthorized();

        var vendors = await _forecastService.GetForecastVendorsForFarmerAsync(farmerId, search);
        return Ok(vendors);
    }

    // GET: /api/forecasts/products?search=milk
    // Only products available in logged-in farmer inventory
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] string? search = null)
    {
        var farmerId = GetUserId();
        if (string.IsNullOrWhiteSpace(farmerId))
            return Unauthorized();

        var products = await _forecastService.GetForecastProductsForFarmerAsync(farmerId, search);
        return Ok(products);
    }

    // GET: /api/forecasts/models
    [HttpGet("models")]
    public IActionResult GetModelNames()
    {
        return Ok(new[] { "MLNET_SSA", "MovingAverage" });
    }

    // GET: /api/forecasts/debug-history
    [HttpGet("debug-history")]
    public async Task<IActionResult> DebugHistory()
    {
        var farmerId = GetUserId();
        if (string.IsNullOrWhiteSpace(farmerId))
            return Unauthorized();

        var pairs = await _forecastService.GetEligiblePairsForFarmerAsync(farmerId, DateTime.UtcNow);

        return Ok(new
        {
            farmerId,
            eligiblePairCount = pairs.Count,
            pairs
        });
    }
}