namespace FarmVendor.Api.Models.DTOs;

public class DispatchRowDto
{
    public int DispatchId { get; set; }
    public int? DemandRequestId { get; set; }

    public int ProductId { get; set; }
    public string Product { get; set; } = "";

    public string VendorId { get; set; } = "";
    public string? VendorName { get; set; }
    public string? VendorEmail { get; set; }

    public decimal QuantityDispatched { get; set; }
    public string Unit { get; set; } = "kg";

    public DateTime DispatchDate { get; set; }
    public string DeliveryStatus { get; set; } = "Planned";
    public DateTime CreatedAt { get; set; }
}