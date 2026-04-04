namespace FarmVendor.Api.Models.DTOs;
//this same DTO can use for vendor side also
public class FarmerDemandRequestRowDto
{
    public int DemandRequestId { get; set; }
    public int ProductId { get; set; }
    public string Product { get; set; } = "";
    public decimal Qty { get; set; }
    public string Unit { get; set; } = "";
    public DateTime NeededBy { get; set; }

    public string Status { get; set; } = "Open";
    public string VendorId { get; set; } = "";


    public string? VendorName { get; set; }
    public string? VendorEmail { get; set; }
     public string? VendorCity { get; set; }
    public string? VendorProvince { get; set; }
    public string? VendorPostalCode { get; set; }

    public double? DistanceToVendor { get; set; }

    public string? ImageUrl { get; set; }
    public string? ImageThumbUrl { get; set; }
}