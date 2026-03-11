namespace FarmVendor.Api.Models;

public class DemandForecast
{
    public int DemandForecastId { get; set; }

    public string VendorId { get; set; } = "";
    public int ProductId { get; set; }

    public DateTime ForecastDate { get; set; }
    public decimal ForecastQty { get; set; }

    public string ModelName { get; set; } = "";
    public int? LookbackPeriods { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser Vendor { get; set; } = null!;
    public Product Product { get; set; } = null!;
}