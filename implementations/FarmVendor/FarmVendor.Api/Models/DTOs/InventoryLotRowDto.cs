namespace FarmVendor.Api.Models.DTOs;

public class InventoryLotRowDto
{
    public int InventoryLotId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public decimal QuantityAvailable { get; set; }
    public string Unit { get; set; } = "kg";
    public DateTime? ExpiryDate { get; set; }
    public DateTime CreatedAt { get; set; }
}