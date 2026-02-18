namespace FarmVendor.Api.Models;

public class DemandRequest
{
    public int DemandRequestId { get; set; }

    public string VendorId { get; set; } = "";
    public ApplicationUser Vendor { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal QuantityRequested { get; set; }

    public string Unit { get; set; } = "kg";

    public DateTime NeededBy { get; set; }

    public string Status { get; set; } = "Open"; 
    // Open, Accepted, Fulfilled, Cancelled

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
