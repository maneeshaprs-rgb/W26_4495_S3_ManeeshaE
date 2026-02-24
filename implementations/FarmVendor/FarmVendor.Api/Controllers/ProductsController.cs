using FarmVendor.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FarmVendor.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // any logged-in user can load products
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ProductsController(AppDbContext db) => _db = db;

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
                    p.DefaultUnit
                })
                .ToListAsync();

            return Ok(items);
        }
    }
}