using FarmVendor.Api.Models.DTOs;

namespace FarmVendor.Api.Services.Interfaces;

public interface IDemandForecastService
{
    Task<List<DemandForecastRowDto>> GenerateForecastAsync(GenerateForecastDto dto);
    Task<List<DemandForecastRowDto>> GetForecastsAsync(int productId, string? vendorId);
    Task<ForecastComparisonDto?> CompareForecastsAsync(int productId, string? vendorId);
}