namespace FarmVendor.Api.Models.DTOs;

public class UpdateMyProfileDto
{
    public string DisplayName { get; set; } = "";
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}