namespace FarmVendor.Api.Models;

public class DemandForecast
{
    public int DemandForecastId { get; set; }

    public string VendorId { get; set; } = "";
    public ApplicationUser Vendor { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public DateTime ForecastDate { get; set; }

    public decimal ForecastQty { get; set; }

    public string ModelName { get; set; } = "MovingAverage";

    public int LookbackPeriods { get; set; } = 3;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}