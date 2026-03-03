namespace FarmVendor.Api.Models.DTOs;

public class CreateDemandRequestDto
{
    public int ProductId { get; set; }
    public decimal QuantityRequested { get; set; }
    public string? Unit { get; set; }         // optional; can default from product
    public DateTime NeededBy { get; set; }    // required
}