using Microsoft.AspNetCore.Mvc;
using PomodoroAPI.Models;
using PomodoroAPI.Services;

namespace PomodoroAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _sessionService;
    private readonly ILogger<SessionsController> _logger;

    public SessionsController(ISessionService sessionService, ILogger<SessionsController> logger)
    {
        _sessionService = sessionService;
        _logger = logger;
    }

    /// <summary>
    /// Get all sessions
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Session>>> GetSessions()
    {
        try
        {
            var sessions = await _sessionService.GetAllSessionsAsync();
            return Ok(sessions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sessions");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get a specific session by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Session>> GetSession(int id)
    {
        try
        {
            var session = await _sessionService.GetSessionByIdAsync(id);
            if (session == null)
            {
                return NotFound($"Session with ID {id} not found");
            }
            return Ok(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving session {SessionId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get the currently active session
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<Session>> GetActiveSession()
    {
        try
        {
            var session = await _sessionService.GetActiveSessionAsync();
            if (session == null)
            {
                return NotFound("No active session found");
            }
            return Ok(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active session");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Start a new work session
    /// </summary>
    [HttpPost("start-work")]
    public async Task<ActionResult<Session>> StartWorkSession([FromBody] StartSessionRequest request)
    {
        try
        {
            var duration = request?.DurationMinutes ?? 25;
            var session = await _sessionService.StartWorkSessionAsync(duration);
            _logger.LogInformation("Started work session with ID {SessionId}", session.Id);
            return CreatedAtAction(nameof(GetSession), new { id = session.Id }, session);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to start work session");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting work session");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Start a new break session
    /// </summary>
    [HttpPost("start-break")]
    public async Task<ActionResult<Session>> StartBreakSession([FromBody] StartSessionRequest request)
    {
        try
        {
            var duration = request?.DurationMinutes ?? 5;
            var session = await _sessionService.StartBreakSessionAsync(duration);
            _logger.LogInformation("Started break session with ID {SessionId}", session.Id);
            return CreatedAtAction(nameof(GetSession), new { id = session.Id }, session);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to start break session");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting break session");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Pause an active session
    /// </summary>
    [HttpPost("{id}/pause")]
    public async Task<ActionResult<Session>> PauseSession(int id)
    {
        try
        {
            var session = await _sessionService.PauseSessionAsync(id);
            _logger.LogInformation("Paused session with ID {SessionId}", id);
            return Ok(session);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Failed to pause session {SessionId}", id);
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to pause session {SessionId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error pausing session {SessionId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Resume a paused session
    /// </summary>
    [HttpPost("{id}/resume")]
    public async Task<ActionResult<Session>> ResumeSession(int id)
    {
        try
        {
            var session = await _sessionService.ResumeSessionAsync(id);
            _logger.LogInformation("Resumed session with ID {SessionId}", id);
            return Ok(session);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Failed to resume session {SessionId}", id);
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to resume session {SessionId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resuming session {SessionId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Complete an active or paused session
    /// </summary>
    [HttpPost("{id}/complete")]
    public async Task<ActionResult<Session>> CompleteSession(int id)
    {
        try
        {
            var session = await _sessionService.CompleteSessionAsync(id);
            _logger.LogInformation("Completed session with ID {SessionId}", id);
            return Ok(session);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Failed to complete session {SessionId}", id);
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to complete session {SessionId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing session {SessionId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Cancel an active, paused, or running session
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<Session>> CancelSession(int id)
    {
        try
        {
            var session = await _sessionService.CancelSessionAsync(id);
            _logger.LogInformation("Cancelled session with ID {SessionId}", id);
            return Ok(session);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Failed to cancel session {SessionId}", id);
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to cancel session {SessionId}", id);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling session {SessionId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update an existing session
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<Session>> UpdateSession(int id, [FromBody] Session session)
    {
        try
        {
            if (id != session.Id)
            {
                return BadRequest("Session ID mismatch");
            }

            var updatedSession = await _sessionService.UpdateSessionAsync(session);
            _logger.LogInformation("Updated session with ID {SessionId}", id);
            return Ok(updatedSession);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating session {SessionId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Delete a session
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSession(int id)
    {
        try
        {
            var result = await _sessionService.DeleteSessionAsync(id);
            if (!result)
            {
                return NotFound($"Session with ID {id} not found");
            }
            _logger.LogInformation("Deleted session with ID {SessionId}", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting session {SessionId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get sessions by date range
    /// </summary>
    [HttpGet("date-range")]
    public async Task<ActionResult<IEnumerable<Session>>> GetSessionsByDateRange(
        [FromQuery] DateTime startDate, 
        [FromQuery] DateTime endDate)
    {
        try
        {
            var sessions = await _sessionService.GetSessionsByDateRangeAsync(startDate, endDate);
            return Ok(sessions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sessions by date range");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get sessions by type (work or break)
    /// </summary>
    [HttpGet("type/{type}")]
    public async Task<ActionResult<IEnumerable<Session>>> GetSessionsByType(string type)
    {
        try
        {
            if (type != "work" && type != "break")
            {
                return BadRequest("Type must be either 'work' or 'break'");
            }

            var sessions = await _sessionService.GetSessionsByTypeAsync(type);
            return Ok(sessions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sessions by type {Type}", type);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Soft deletes all sessions (marks them as deleted but keeps in database)
    /// </summary>
    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAllSessions()
    {
        try
        {
            var result = await _sessionService.ClearAllSessionsAsync();
            if (result)
            {
                return Ok(new { message = "All sessions have been cleared", count = "all" });
            }
            else
            {
                return Ok(new { message = "No sessions to clear", count = 0 });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing all sessions");
            return StatusCode(500, "Internal server error");
        }
    }
}

/// <summary>
/// Request model for starting a session
/// </summary>
public class StartSessionRequest
{
    public int DurationMinutes { get; set; } = 25;
}
