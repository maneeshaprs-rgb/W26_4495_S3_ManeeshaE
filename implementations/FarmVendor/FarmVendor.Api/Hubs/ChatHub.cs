using FarmVendor.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace FarmVendor.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ChatService _chatService;

    public ChatHub(ChatService chatService)
    {
        _chatService = chatService;
    }

    public async Task JoinConversation(string conversationKey)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, conversationKey);
    }

    public async Task LeaveConversation(string conversationKey)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationKey);
    }

    public async Task SendMessage(int conversationId, string messageText)
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? Context.User?.FindFirstValue("sub");

        var role = Context.User?.FindFirstValue(ClaimTypes.Role) ?? "";

        if (string.IsNullOrWhiteSpace(userId))
            throw new HubException("Unauthorized");

        if (string.IsNullOrWhiteSpace(messageText))
            throw new HubException("Message cannot be empty.");

        var saved = await _chatService.SaveMessageAsync(conversationId, userId, role, messageText);

        var conversationKey = $"conversation-{conversationId}";

        await Clients.Group(conversationKey).SendAsync("ReceiveMessage", new
        {
            chatMessageId = saved.ChatMessageId,
            conversationId = saved.ConversationId,
            senderId = saved.SenderId,
            senderRole = saved.SenderRole,
            messageText = saved.MessageText,
            sentAt = saved.SentAt,
            isRead = saved.IsRead
        });
    }
}