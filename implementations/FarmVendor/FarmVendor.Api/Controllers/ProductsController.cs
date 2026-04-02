using System.Net.Http.Headers;
using System.Text.Json;
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
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public ProductsController(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
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
                    p.DefaultUnit,
                    p.ImageUrl,
                    p.ImageThumbUrl,
                    p.ImageSource,
                    p.PhotographerName,
                    p.PhotographerProfile
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("search-images")]
        public async Task<IActionResult> SearchImages([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Query is required.");

            var accessKey = _config["Unsplash:AccessKey"];
            if (string.IsNullOrWhiteSpace(accessKey))
                return StatusCode(500, "Unsplash access key is not configured.");

            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Client-ID", accessKey);
            httpClient.DefaultRequestHeaders.Add("Accept-Version", "v1");

            var url =
                $"https://api.unsplash.com/search/photos?query={Uri.EscapeDataString(query.Trim())}&per_page=8";

            var response = await httpClient.GetAsync(url);
            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, json);

            using var doc = JsonDocument.Parse(json);
            var results = new List<ProductImageSearchResultDto>();

            if (doc.RootElement.TryGetProperty("results", out var resultsElement))
            {
                foreach (var item in resultsElement.EnumerateArray())
                {
                    var urls = item.GetProperty("urls");
                    var user = item.GetProperty("user");
                    var links = item.GetProperty("links");

                    results.Add(new ProductImageSearchResultDto
                    {
                        ImageUrl = urls.TryGetProperty("small", out var small) ? small.GetString() ?? "" : "",
                        ThumbnailUrl = urls.TryGetProperty("thumb", out var thumb) ? thumb.GetString() ?? "" : "",
                        Alt = item.TryGetProperty("alt_description", out var alt) ? alt.GetString() ?? "" : "",
                        Source = "Unsplash",
                        PhotographerName = user.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
                        PhotographerProfile = user.TryGetProperty("links", out var userLinks) &&
                                              userLinks.TryGetProperty("html", out var html)
                            ? html.GetString() ?? ""
                            : "",
                        DownloadLocation = links.TryGetProperty("download_location", out var dl)
                            ? dl.GetString() ?? ""
                            : ""
                    });
                }
            }

            return Ok(results);
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
                ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl) ? null : dto.ImageUrl.Trim(),
                ImageThumbUrl = string.IsNullOrWhiteSpace(dto.ImageThumbUrl) ? null : dto.ImageThumbUrl.Trim(),
                ImageSource = string.IsNullOrWhiteSpace(dto.ImageSource) ? null : dto.ImageSource.Trim(),
                PhotographerName = string.IsNullOrWhiteSpace(dto.PhotographerName) ? null : dto.PhotographerName.Trim(),
                PhotographerProfile = string.IsNullOrWhiteSpace(dto.PhotographerProfile) ? null : dto.PhotographerProfile.Trim(),
                IsActive = true
            };

            _db.Product.Add(product);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                product.ProductId,
                product.Name,
                product.Category,
                product.DefaultUnit,
                product.ImageUrl,
                product.ImageThumbUrl,
                product.ImageSource,
                product.PhotographerName,
                product.PhotographerProfile
            });
        }
    }
}