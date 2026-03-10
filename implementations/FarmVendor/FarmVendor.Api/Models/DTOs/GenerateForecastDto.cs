namespace FarmVendor.Api.Models.DTOs;

public class GenerateForecastDto
{
    public int ProductId { get; set; }
    public string? VendorId { get; set; }   // optional if forecasting by product only
    public int Horizon { get; set; } = 7;   // next 7 periods
    public string Granularity { get; set; } = "Daily"; // Daily or Weekly
    public bool SaveToDatabase { get; set; } = true;
}