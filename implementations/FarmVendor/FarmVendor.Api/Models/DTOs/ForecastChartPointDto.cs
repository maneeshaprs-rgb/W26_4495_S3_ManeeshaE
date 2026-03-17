namespace FarmVendor.Api.Models.DTOs;

public class ForecastChartPointDto
{
    public string Date { get; set; } = "";
    public decimal Quantity { get; set; }
    public string Series { get; set; } = ""; // Historical or Forecast
}