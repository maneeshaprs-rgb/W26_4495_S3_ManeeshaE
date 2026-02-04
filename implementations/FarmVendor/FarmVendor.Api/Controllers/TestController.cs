using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FarmVendor.Api.Controllers;

[ApiController]
[Route("api/test")]
public class TestController : ControllerBase
{
    [HttpGet("public")]
    public IActionResult Public()
        => Ok("Public endpoint works!");

    [Authorize]
    [HttpGet("protected")]//protected end point defined with GET
    public IActionResult Protected()
        => Ok("SUCCESS : You accessed a protected endpoint with JWT!");

    [Authorize(Roles = "Farmer")]
    [HttpGet("farmer")]
    public IActionResult FarmerOnly()
        => Ok("Farmer-only endpoint OK");

    [Authorize(Roles = "Vendor")]
    [HttpGet("vendor")]
    public IActionResult VendorOnly()
        => Ok("Vendor-only endpoint OK");
}
