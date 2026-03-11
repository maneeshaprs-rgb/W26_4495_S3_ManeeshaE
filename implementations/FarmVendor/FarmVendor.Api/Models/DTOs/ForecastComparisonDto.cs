namespace FarmVendor.Api.Models.DTOs;

public class ForecastComparisonDto
{
    public int ProductId { get; set; }
    public string? VendorId { get; set; }

    public decimal MovingAveragePrediction { get; set; }
    public decimal MlnetPrediction { get; set; }

    public decimal Difference => MlnetPrediction - MovingAveragePrediction;
}