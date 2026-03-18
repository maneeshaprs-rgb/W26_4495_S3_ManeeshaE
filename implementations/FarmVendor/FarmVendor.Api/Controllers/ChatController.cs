using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using FarmVendor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly ChatService _chatService;
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public ChatController(
        ChatService chatService,
        AppDbContext db,
        UserManager<ApplicationUser> userManager)
    {
        _chatService = chatService;
        _db = db;
        _userManager = userManager;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsersByRole([FromQuery] string role, [FromQuery] string? search = null)
    {
        if (string.IsNullOrWhiteSpace(role))
            return BadRequest("Role is required.");

        var usersInRole = await _userManager.GetUsersInRoleAsync(role);

        var query = usersInRole.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                (u.DisplayName != null && u.DisplayName.ToLower().Contains(term)) ||
                (u.Email != null && u.Email.ToLower().Contains(term)));
        }

        var result = query
            .OrderBy(u => u.DisplayName)
            .Select(u => new ChatUserLookupDto
            {
                Id = u.Id,
                DisplayName = u.DisplayName ?? "",
                Email = u.Email ?? "",
                Role = role
            })
            .ToList();

        return Ok(result);
    }

    [HttpPost("conversation")]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationDto dto)
    {
        var currentUserId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        var currentRole =
            User.FindFirstValue(ClaimTypes.Role) ??
            User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;

        if (string.IsNullOrWhiteSpace(currentUserId))
            return Unauthorized("User ID not found in token.");

        string farmerId;
        string vendorId;

        if (string.Equals(currentRole, "Farmer", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(dto.VendorId))
                return BadRequest("VendorId is required.");

            farmerId = currentUserId;
            vendorId = dto.VendorId.Trim();
        }
        else if (string.Equals(currentRole, "Vendor", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(dto.FarmerId))
                return BadRequest("FarmerId is required.");

            farmerId = dto.FarmerId.Trim();
            vendorId = currentUserId;
        }
        else
        {
            return BadRequest("Unsupported role.");
        }

        var farmerExists = await _db.Users.AnyAsync(u => u.Id == farmerId);
        var vendorExists = await _db.Users.AnyAsync(u => u.Id == vendorId);

        if (!farmerExists)
            return BadRequest($"FarmerId '{farmerId}' does not exist.");
        if (!vendorExists)
            return BadRequest($"VendorId '{vendorId}' does not exist.");

        var conversation = await _chatService.CreateOrGetConversationAsync(farmerId, vendorId);

        return Ok(new
        {
            conversationId = conversation.ConversationId,
            farmerId = conversation.FarmerId,
            vendorId = conversation.VendorId
        });
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetMyConversations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var conversations = await _chatService.GetMyConversationsAsync(userId);
        return Ok(conversations.Select(c => new
        {
            conversationId = c.ConversationId,
            farmerId = c.FarmerId,
            vendorId = c.VendorId,
            createdAt = c.CreatedAt
        }));
    }

    [HttpGet("messages/{conversationId:int}")]
    public async Task<IActionResult> GetMessages(int conversationId)
    {
        var messages = await _chatService.GetMessagesAsync(conversationId);
        return Ok(messages);
    }
}