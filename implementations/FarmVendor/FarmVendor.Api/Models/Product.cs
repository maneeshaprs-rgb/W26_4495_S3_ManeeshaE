namespace FarmVendor.Api.Models;

public class Product
{
    public int ProductId { get; set; }

    public string Name { get; set; } = "";

    public string? Category { get; set; }

    public string DefaultUnit { get; set; } = "kg";

    public string? ImageUrl { get; set; }

    public string? ImageThumbUrl { get; set; }

    public string? ImageSource { get; set; }

    public string? PhotographerName { get; set; }

    public string? PhotographerProfile { get; set; }

    public bool IsActive { get; set; } = true;
}