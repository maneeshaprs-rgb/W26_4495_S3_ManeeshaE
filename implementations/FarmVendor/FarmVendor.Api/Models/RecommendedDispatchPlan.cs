namespace FarmVendor.Api.Models;

public class RecommendedDispatchPlan
{
   public int RecommendedDispatchPlanId { get; set; }

    public string FarmerId { get; set; } = "";
    public ApplicationUser Farmer { get; set; } = null!;

    public string VendorId { get; set; } = "";
    public ApplicationUser Vendor { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal RecommendedQty { get; set; }

    public DateTime PlanDate { get; set; }

    public string Algorithm { get; set; } = "GreedyBaseline";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}