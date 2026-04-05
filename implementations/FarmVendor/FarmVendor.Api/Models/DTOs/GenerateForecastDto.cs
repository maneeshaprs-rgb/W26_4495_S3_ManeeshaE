namespace FarmVendor.Api.Models.DTOs;

public class GenerateForecastDto
{
    public DateTime ForecastDate { get; set; }

    // for Moving Average
    public int LookbackPeriods { get; set; } = 3;

    // default model should be MLNET_SSA
    public string ModelName { get; set; } = "MLNET_SSA";

    // for ML.NET
    public int Horizon { get; set; } = 7;
    public string? Granularity { get; set; } = "Daily";

    // optional vendor filter
    public string? VendorId { get; set; }
    public string? VendorName { get; set; }
}