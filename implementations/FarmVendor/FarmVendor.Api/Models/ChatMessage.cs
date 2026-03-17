namespace FarmVendor.Api.Models;

public class ChatMessage
{
    public int ChatMessageId { get; set; }

    public int ConversationId { get; set; }

    public string SenderId { get; set; } = "";
    public string SenderRole { get; set; } = "";

    public string MessageText { get; set; } = "";

    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; } = false;

    public Conversation Conversation { get; set; } = null!;
    public ApplicationUser Sender { get; set; } = null!;
}