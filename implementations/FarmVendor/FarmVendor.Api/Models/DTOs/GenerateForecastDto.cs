namespace FarmVendor.Api.Models.DTOs;

public class GenerateForecastDto
{
    public DateTime ForecastDate { get; set; }
    public int LookbackPeriods { get; set; } = 3;
}