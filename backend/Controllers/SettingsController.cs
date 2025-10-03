using Microsoft.AspNetCore.Mvc;
using PomodoroAPI.Services;

namespace PomodoroAPI.Controllers;

/// <summary>
/// Controller for managing Pomodoro settings
/// Provides REST API endpoints for settings configuration
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(ISettingsService settingsService, ILogger<SettingsController> logger)
    {
        _settingsService = settingsService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current Pomodoro settings
    /// </summary>
    /// <returns>Current settings configuration</returns>
    [HttpGet]
    public async Task<ActionResult<PomodoroSettingsDto>> GetSettings()
    {
        try
        {
            _logger.LogInformation("Getting current Pomodoro settings");
            var settings = await _settingsService.GetSettingsAsync();
            return Ok(settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting settings");
            return StatusCode(500, "Internal server error while retrieving settings");
        }
    }

    /// <summary>
    /// Updates the Pomodoro settings
    /// </summary>
    /// <param name="settings">The new settings to apply</param>
    /// <returns>Updated settings configuration</returns>
    [HttpPut]
    public async Task<ActionResult<PomodoroSettingsDto>> UpdateSettings([FromBody] PomodoroSettingsDto settings)
    {
        try
        {
            _logger.LogInformation("Updating Pomodoro settings");
            
            // Validate settings
            if (settings.WorkDuration < 1 || settings.WorkDuration > 120)
                return BadRequest("Work duration must be between 1 and 120 minutes");
            
            if (settings.BreakDuration < 1 || settings.BreakDuration > 60)
                return BadRequest("Break duration must be between 1 and 60 minutes");
            
            if (settings.LongBreakDuration < 1 || settings.LongBreakDuration > 120)
                return BadRequest("Long break duration must be between 1 and 120 minutes");
            
            if (settings.SessionsUntilLongBreak < 1 || settings.SessionsUntilLongBreak > 20)
                return BadRequest("Sessions until long break must be between 1 and 20");

            var updatedSettings = await _settingsService.UpdateSettingsAsync(settings);
            return Ok(updatedSettings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating settings");
            return StatusCode(500, "Internal server error while updating settings");
        }
    }

    /// <summary>
    /// Resets all settings to default values
    /// </summary>
    /// <returns>Default settings configuration</returns>
    [HttpPost("reset")]
    public async Task<ActionResult<PomodoroSettingsDto>> ResetToDefaults()
    {
        try
        {
            _logger.LogInformation("Resetting settings to defaults");
            var defaultSettings = await _settingsService.ResetToDefaultsAsync();
            return Ok(defaultSettings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting settings to defaults");
            return StatusCode(500, "Internal server error while resetting settings");
        }
    }

    /// <summary>
    /// Gets a specific setting value by key
    /// </summary>
    /// <param name="key">The setting key</param>
    /// <returns>The setting value</returns>
    [HttpGet("{key}")]
    public async Task<ActionResult<string>> GetSetting(string key)
    {
        try
        {
            _logger.LogInformation("Getting setting value for key: {Key}", key);
            var value = await _settingsService.GetSettingValueAsync(key);
            return Ok(value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting setting value for key: {Key}", key);
            return StatusCode(500, "Internal server error while retrieving setting");
        }
    }
}
