namespace FarmVendor.Api.Models.DTOs;

public class ForecastProductOptionDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = "";
    public string DefaultUnit { get; set; } = "";
}