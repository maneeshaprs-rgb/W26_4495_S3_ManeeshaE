namespace FarmVendor.Api.Models.DTOs;

public class GenerateForecastDto
{
    public DateTime ForecastDate { get; set; }

    // for Moving Average
    public int LookbackPeriods { get; set; } = 3;

    // choose model
    public string ModelName { get; set; } = "MovingAverage";

    // for ML.NET
    public int Horizon { get; set; } = 7;
    public string? Granularity { get; set; } = "Daily";
}