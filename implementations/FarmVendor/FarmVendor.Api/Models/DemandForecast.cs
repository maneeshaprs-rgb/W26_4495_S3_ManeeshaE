namespace FarmVendor.Api.Models;

public class DemandForecast
{
    public int DemandForecastId { get; set; }

    public string VendorId { get; set; } = "";
    public int ProductId { get; set; }

    public DateTime ForecastDate { get; set; }

    public decimal PredictedQuantity { get; set; }
    public decimal? LowerBound { get; set; }
    public decimal? UpperBound { get; set; }

    public string ModelType { get; set; } = ""; // algorithm : MovingAverage // MLNET_SSA
    public string Granularity { get; set; } = "Daily"; // Daily / Weekly

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}