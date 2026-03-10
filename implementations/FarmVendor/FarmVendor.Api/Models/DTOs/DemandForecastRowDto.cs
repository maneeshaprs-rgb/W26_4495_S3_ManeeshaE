namespace FarmVendor.Api.Models.DTOs;

public class DemandForecastRowDto
{
    public int DemandForecastId { get; set; }
    public string VendorId { get; set; } = "";
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public DateTime ForecastDate { get; set; }
    public decimal ForecastQty { get; set; }
    public string ModelName { get; set; } = "";
    public int LookbackPeriods { get; set; }
    public DateTime CreatedAt { get; set; }

    //use for forecasting
    public decimal PredictedQuantity { get; set; }
    public decimal? LowerBound { get; set; }
    public decimal? UpperBound { get; set; }
    public string ModelType { get; set; } = "";
    public string Granularity { get; set; } = "";

}