using Microsoft.AspNetCore.Identity;

namespace FarmVendor.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = "";
}