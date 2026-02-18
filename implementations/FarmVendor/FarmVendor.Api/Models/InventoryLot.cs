namespace FarmVendor.Api.Models;

public class InventoryLot
{
    public int InventoryLotId { get; set; }

    public string FarmerId { get; set; } = "";
    public ApplicationUser Farmer { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal QuantityAvailable { get; set; }

    public string Unit { get; set; } = "kg";

    public DateTime? ExpiryDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
