namespace FarmVendor.Api.Models.DTOs;

public class SendMessageDto
{
    public int ConversationId { get; set; }
    public string MessageText { get; set; } = "";
}