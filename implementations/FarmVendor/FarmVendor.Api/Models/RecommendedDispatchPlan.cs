namespace FarmVendor.Api.Models;

public class RecommendedDispatchPlan
{
    public int RecommendedDispatchPlanId { get; set; }

    public string FarmerId { get; set; } = "";
    public string VendorId { get; set; } = "";

    public int ProductId { get; set; }

    public decimal RecommendedQty { get; set; }

    public DateTime PlanDate { get; set; }

    public string Algorithm { get; set; } = "GreedyBaseline";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}