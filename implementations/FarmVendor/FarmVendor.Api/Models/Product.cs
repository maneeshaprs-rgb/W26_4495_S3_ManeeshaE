namespace FarmVendor.Api.Models;

public class Product
{
    public int ProductId { get; set; }

    public string Name { get; set; } = "";

    public string? Category { get; set; }

    public string DefaultUnit { get; set; } = "kg";

    public bool IsActive { get; set; } = true;
}
