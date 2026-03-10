namespace FarmVendor.Api.Models.DTOs;

public class RecommendedDispatchPlanRowDto
{
    public int RecommendedDispatchPlanId { get; set; }

    public string FarmerId { get; set; } = "";
    public string? FarmerName { get; set; }

    public string VendorId { get; set; } = "";
    public string? VendorName { get; set; }

    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";

    public decimal RecommendedQty { get; set; }
    public DateTime PlanDate { get; set; }
    public string Algorithm { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}