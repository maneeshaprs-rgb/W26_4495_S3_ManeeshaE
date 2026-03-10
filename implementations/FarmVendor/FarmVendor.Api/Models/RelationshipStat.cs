namespace FarmVendor.Api.Models;

public class RelationshipStat
{
    public int RelationshipStatId { get; set; }

    public string FarmerId { get; set; } = "";
    public ApplicationUser Farmer { get; set; } = null!;

    public string VendorId { get; set; } = "";
    public ApplicationUser Vendor { get; set; } = null!;

    public int SuccessfulDispatchCount { get; set; } = 0;

    public int CancelledDispatchCount { get; set; } = 0;

    public DateTime? LastDispatchDate { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    // metrics
    public int TotalDispatches { get; set; }
    public int DeliveredCount { get; set; }
    public int CancelledCount { get; set; }
    public int OnTimeDeliveredCount { get; set; }

    public decimal TotalRequestedQty { get; set; }
    public decimal TotalDeliveredQty { get; set; }

    // final score (0–100)
    public decimal RelationshipScore { get; set; }

    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
}