namespace FarmVendor.Api.Models.DTOs;

public class DemandRequestExportRowDto
{
    public int DemandRequestId { get; set; }
    public string VendorId { get; set; } = "";
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";

    public decimal QuantityRequested { get; set; }
    public string Unit { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime NeededBy { get; set; }
    public string Status { get; set; } = "";

    // Dispatch summary (computed)
    public decimal TotalDispatchedQty { get; set; }
    public DateTime? FirstDispatchDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public bool IsDelivered { get; set; }
    public bool IsFulfilledOnTime { get; set; }
}