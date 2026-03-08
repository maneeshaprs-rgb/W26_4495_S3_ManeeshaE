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
}