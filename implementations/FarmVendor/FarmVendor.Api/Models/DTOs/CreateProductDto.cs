namespace FarmVendor.Api.Models.DTOs
{
    public class CreateProductDto
    {
        public string Name { get; set; } = "";
        public string? Category { get; set; }
        public string DefaultUnit { get; set; } = "kg";
    }
}