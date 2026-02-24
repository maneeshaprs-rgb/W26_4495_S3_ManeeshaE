using System;
using System.ComponentModel.DataAnnotations;

namespace FarmVendor.Api.Models.DTOs
{
    public class CreateInventoryLotDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [Range(0.01, 999999)]
        public decimal QuantityAvailable { get; set; }

        public string? Unit { get; set; } // if empty Product.DefaultUnit

        public DateTime? ExpiryDate { get; set; }
    }
}