namespace FarmVendor.Api.Models.DTOs;

public class RelationshipScoreRowDto
{
    public int RelationshipStatId { get; set; }

    public string FarmerId { get; set; } = "";
    public string? FarmerName { get; set; }

    public string VendorId { get; set; } = "";
    public string? VendorName { get; set; }

    public int TotalDispatches { get; set; }
    public int DeliveredCount { get; set; }
    public int CancelledCount { get; set; }
    public int OnTimeDeliveredCount { get; set; }

    public decimal TotalRequestedQty { get; set; }
    public decimal TotalDeliveredQty { get; set; }

    public decimal RelationshipScore { get; set; }

    public decimal OnTimeRate { get; set; }
    public decimal FulfillmentRate { get; set; }
    public decimal CancellationRate { get; set; }

    public DateTime LastUpdatedAt { get; set; }
}