namespace FarmVendor.Api.Models;

public class Conversation
{
    public int ConversationId { get; set; }

    public string FarmerId { get; set; } = "";
    public string VendorId { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser Farmer { get; set; } = null!;
    public ApplicationUser Vendor { get; set; } = null!;

    public List<ChatMessage> Messages { get; set; } = new();
}