namespace FarmVendor.Api.Models.DTOs;

public class RecommendedVendorRowDto
{
    public string VendorId { get; set; } = "";
    public string VendorName { get; set; } = "";
    public double DistanceKm { get; set; }
    public decimal RelationshipScore { get; set; }
    public decimal TotalForecastDemand { get; set; }
    public decimal MatchableQuantity { get; set; }
    public int MatchedProductCount { get; set; }
    public decimal FinalScore { get; set; }
    public List<string> MatchedProducts { get; set; } = new();
}