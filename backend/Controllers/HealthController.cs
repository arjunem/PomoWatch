using Microsoft.AspNetCore.Mvc;
using PomodoroAPI.Data;
using PomodoroAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace PomodoroAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly PomodoroDbContext _context;
    private readonly ISessionService _sessionService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        PomodoroDbContext context, 
        ISessionService sessionService, 
        ILogger<HealthController> logger)
    {
        _context = context;
        _sessionService = sessionService;
        _logger = logger;
    }

    /// <summary>
    /// Basic health check
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Detailed health check including database connectivity
    /// </summary>
    [HttpGet("detailed")]
    public async Task<IActionResult> GetDetailed()
    {
        try
        {
            // Test database connectivity
            var canConnect = await _context.Database.CanConnectAsync();
            var activeSession = await _sessionService.GetActiveSessionAsync();
            var totalSessions = await _context.Sessions.CountAsync();

            return Ok(new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                database = new
                {
                    connected = canConnect,
                    totalSessions = totalSessions
                },
                currentSession = activeSession != null ? new
                {
                    id = activeSession.Id,
                    type = activeSession.Type,
                    status = activeSession.Status,
                    duration = activeSession.DurationMinutes
                } : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(500, new
            {
                status = "unhealthy",
                timestamp = DateTime.UtcNow,
                error = ex.Message
            });
        }
    }
}

