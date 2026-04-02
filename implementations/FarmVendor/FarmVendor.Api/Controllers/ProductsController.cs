using FarmVendor.Api.Data;
using FarmVendor.Api.Models;
using FarmVendor.Api.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // any logged-in user can load/create products
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ProductsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var items = await _db.Product
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .Select(p => new
                {
                    p.ProductId,
                    p.Name,
                    p.Category,
                    p.DefaultUnit
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
        {
            if (dto == null)
                return BadRequest("Product data is required.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Product name is required.");

            if (string.IsNullOrWhiteSpace(dto.DefaultUnit))
                return BadRequest("Default unit is required.");

            var name = dto.Name.Trim();
            var category = string.IsNullOrWhiteSpace(dto.Category) ? null : dto.Category.Trim();
            var defaultUnit = dto.DefaultUnit.Trim();

            var exists = await _db.Product.AnyAsync(p => p.Name.ToLower() == name.ToLower());

            if (exists)
                return BadRequest("A product with this name already exists.");

            var product = new Product
            {
                Name = name,
                Category = category,
                DefaultUnit = defaultUnit,
                IsActive = true
            };

            _db.Product.Add(product);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                product.ProductId,
                product.Name,
                product.Category,
                product.DefaultUnit
            });
        }
    }
}