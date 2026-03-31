using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ProfileController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    private string GetUserId()
        => User.FindFirstValue(ClaimTypes.NameIdentifier)
           ?? User.FindFirstValue("sub")
           ?? "";

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound("User not found.");

        var roles = await _userManager.GetRolesAsync(user);

        var dto = new MyProfileDto
        {
            UserId = user.Id,
            Email = user.Email ?? "",
            DisplayName = user.DisplayName ?? "",
            Role = roles.FirstOrDefault() ?? "",
            City = user.City,
            Province = user.Province,
            PostalCode = user.PostalCode,
            Latitude = user.Latitude,
            Longitude = user.Longitude
        };

        return Ok(dto);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileDto dto)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound("User not found.");

        if (string.IsNullOrWhiteSpace(dto.DisplayName))
            return BadRequest("DisplayName is required.");

        if (string.IsNullOrWhiteSpace(dto.City))
            return BadRequest("City is required.");

        if (string.IsNullOrWhiteSpace(dto.Province))
            return BadRequest("Province is required.");

        if (string.IsNullOrWhiteSpace(dto.PostalCode))
            return BadRequest("PostalCode is required.");

        if (!dto.Latitude.HasValue || !dto.Longitude.HasValue)
            return BadRequest("Latitude and Longitude are required.");

        user.DisplayName = dto.DisplayName.Trim();
        user.City = dto.City.Trim();
        user.Province = dto.Province.Trim();
        user.PostalCode = dto.PostalCode.Trim().ToUpperInvariant();
        user.Latitude = dto.Latitude.Value;
        user.Longitude = dto.Longitude.Value;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new MyProfileDto
        {
            UserId = user.Id,
            Email = user.Email ?? "",
            DisplayName = user.DisplayName ?? "",
            Role = roles.FirstOrDefault() ?? "",
            City = user.City,
            Province = user.Province,
            PostalCode = user.PostalCode,
            Latitude = user.Latitude,
            Longitude = user.Longitude
        });
    }
}