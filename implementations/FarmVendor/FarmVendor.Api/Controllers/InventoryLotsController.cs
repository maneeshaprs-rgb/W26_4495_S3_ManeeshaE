using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Farmer")]
    public class InventoryLotsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public InventoryLotsController(AppDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateInventoryLotDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

            var product = await _db.Product
                .FirstOrDefaultAsync(p => p.ProductId == dto.ProductId && p.IsActive);

            if (product == null)
                return BadRequest("Invalid product.");

            // basic expiry validation
            if (dto.ExpiryDate.HasValue && dto.ExpiryDate.Value.Date < DateTime.UtcNow.Date)
                return BadRequest("Expiry date cannot be in the past.");

            var lot = new InventoryLot
            {
                FarmerId = userId,
                ProductId = dto.ProductId,
                QuantityAvailable = dto.QuantityAvailable,
                Unit = string.IsNullOrWhiteSpace(dto.Unit) ? product.DefaultUnit : dto.Unit!.Trim(),
                ExpiryDate = dto.ExpiryDate,
                CreatedAt = DateTime.UtcNow
            };

            _db.InventoryLot.Add(lot);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                lot.InventoryLotId,
                lot.ProductId,
                ProductName = product.Name,
                lot.QuantityAvailable,
                lot.Unit,
                lot.ExpiryDate,
                lot.CreatedAt
            });
        }
    }
}