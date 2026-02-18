using Microsoft.AspNetCore.Identity;

namespace FarmVendor.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = "";

    // Location : this gonna use for distance calculation in next phase
    public string City { get; set; } = "";
    public string Province { get; set; } = "";
    public string PostalCode { get; set; } = "";

    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
