namespace FarmVendor.Api.Models.DTOs;

public class CreateDispatchDto
{
    public int DemandRequestId { get; set; }
    public decimal QuantityDispatched { get; set; }
    public DateTime? DispatchDate { get; set; } // this is optional
}