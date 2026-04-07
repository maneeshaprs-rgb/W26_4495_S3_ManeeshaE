namespace FarmVendor.Api.Models.DTOs;

public class ConversationRowDto
{
    public int ConversationId { get; set; }
    public string OtherUserId { get; set; } = "";
    public string OtherUserDisplayName { get; set; } = "";
    public string OtherUserRole { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
