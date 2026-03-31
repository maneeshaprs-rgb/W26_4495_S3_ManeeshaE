namespace FarmVendor.Api.Models.DTOs;

public class MyProfileDto
{
    public string UserId { get; set; } = "";
    public string Email { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Role { get; set; } = "";
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }

    public bool ProfileComplete =>
        !string.IsNullOrWhiteSpace(DisplayName) &&
        !string.IsNullOrWhiteSpace(City) &&
        !string.IsNullOrWhiteSpace(Province) &&
        !string.IsNullOrWhiteSpace(PostalCode) &&
        Latitude.HasValue &&
        Longitude.HasValue;
}