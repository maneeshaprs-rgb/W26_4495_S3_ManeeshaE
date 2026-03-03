namespace FarmVendor.Api.Models.DTOs;

public class UpdateInventoryLotDto
{
    public decimal QuantityAvailable { get; set; }
    public string? Unit { get; set; }
    public DateTime? ExpiryDate { get; set; }
}