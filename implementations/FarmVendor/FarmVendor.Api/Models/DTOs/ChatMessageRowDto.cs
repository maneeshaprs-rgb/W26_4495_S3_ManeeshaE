namespace FarmVendor.Api.Models.DTOs;

public class ChatMessageRowDto
{
    public int ChatMessageId { get; set; }
    public int ConversationId { get; set; }
    public string SenderId { get; set; } = "";
    public string SenderRole { get; set; } = "";
    public string MessageText { get; set; } = "";
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
}