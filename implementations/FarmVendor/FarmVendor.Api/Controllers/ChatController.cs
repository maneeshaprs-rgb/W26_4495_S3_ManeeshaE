using FarmVendor.Api.Models.DTOs;
using FarmVendor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly ChatService _chatService;

    public ChatController(ChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpPost("conversation")]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationDto dto)
    {
        var conversation = await _chatService.CreateOrGetConversationAsync(dto.FarmerId, dto.VendorId);

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