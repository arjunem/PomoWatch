using Microsoft.AspNetCore.Mvc;

namespace PomodoroAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("ok");
    }
}

