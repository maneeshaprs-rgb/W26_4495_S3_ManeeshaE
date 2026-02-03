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
    [HttpGet("protected")]
    public IActionResult Protected()
        => Ok("SUCCESS : You accessed a protected endpoint with JWT!");
}
