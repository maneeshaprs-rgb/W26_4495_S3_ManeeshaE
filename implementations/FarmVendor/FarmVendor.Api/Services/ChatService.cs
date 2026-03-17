using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Services;

public class ChatService
{
    private readonly AppDbContext _db;

    public ChatService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Conversation> CreateOrGetConversationAsync(string farmerId, string vendorId)
    {
        var existing = await _db.Conversation
            .FirstOrDefaultAsync(c => c.FarmerId == farmerId && c.VendorId == vendorId);

        if (existing != null) return existing;

        var conversation = new Conversation
        {
            FarmerId = farmerId,
            VendorId = vendorId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Conversation.Add(conversation);
        await _db.SaveChangesAsync();

        return conversation;
    }

    public async Task<List<Conversation>> GetMyConversationsAsync(string userId)
    {
        return await _db.Conversation
            .Include(c => c.Messages)
            .Where(c => c.FarmerId == userId || c.VendorId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<ChatMessageRowDto>> GetMessagesAsync(int conversationId)
    {
        return await _db.ChatMessage
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId)
            .OrderBy(m => m.SentAt)
            .Select(m => new ChatMessageRowDto
            {
                ChatMessageId = m.ChatMessageId,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderRole = m.SenderRole,
                MessageText = m.MessageText,
                SentAt = m.SentAt,
                IsRead = m.IsRead
            })
            .ToListAsync();
    }

    public async Task<ChatMessage> SaveMessageAsync(int conversationId, string senderId, string senderRole, string messageText)
    {
        var message = new ChatMessage
        {
            ConversationId = conversationId,
            SenderId = senderId,
            SenderRole = senderRole,
            MessageText = messageText,
            SentAt = DateTime.UtcNow,
            IsRead = false
        };

        _db.ChatMessage.Add(message);
        await _db.SaveChangesAsync();

        return message;
    }
}