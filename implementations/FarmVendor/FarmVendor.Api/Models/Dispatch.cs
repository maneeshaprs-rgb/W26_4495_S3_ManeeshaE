namespace FarmVendor.Api.Models;

public class Dispatch
{
    public int DispatchId { get; set; }

    public int? DemandRequestId { get; set; }
    public DemandRequest? DemandRequest { get; set; }

    public string FarmerId { get; set; } = "";
    public ApplicationUser Farmer { get; set; } = null!;

    public string VendorId { get; set; } = "";
    public ApplicationUser Vendor { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal QuantityDispatched { get; set; }

    public string Unit { get; set; } = "kg";

    public DateTime DispatchDate { get; set; }

    public string DeliveryStatus { get; set; } = "Planned";
    // Planned, InTransit, Delivered, Cancelled

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
