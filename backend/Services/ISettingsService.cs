using PomodoroAPI.Models;

namespace PomodoroAPI.Services;

/// <summary>
/// Service interface for managing Pomodoro settings business logic
/// Provides high-level operations for settings management
/// </summary>
public interface ISettingsService
{
    /// <summary>
    /// Gets all current Pomodoro settings
    /// Returns default values for any missing settings
    /// </summary>
    /// <returns>Complete Pomodoro settings object</returns>
    Task<PomodoroSettingsDto> GetSettingsAsync();

    /// <summary>
    /// Updates Pomodoro settings
    /// Creates or updates individual setting records
    /// </summary>
    /// <param name="settings">The settings to update</param>
    /// <returns>The updated settings</returns>
    Task<PomodoroSettingsDto> UpdateSettingsAsync(PomodoroSettingsDto settings);

    /// <summary>
    /// Gets a specific setting value by key
    /// </summary>
    /// <param name="key">The setting key</param>
    /// <param name="defaultValue">Default value if setting not found</param>
    /// <returns>The setting value</returns>
    Task<string> GetSettingValueAsync(string key, string defaultValue = "");

    /// <summary>
    /// Sets a specific setting value by key
    /// </summary>
    /// <param name="key">The setting key</param>
    /// <param name="value">The setting value</param>
    /// <returns>The updated setting</returns>
    Task<Settings> SetSettingValueAsync(string key, string value);

    /// <summary>
    /// Resets all settings to default values
    /// </summary>
    /// <returns>The default settings</returns>
    Task<PomodoroSettingsDto> ResetToDefaultsAsync();
}

/// <summary>
/// Data Transfer Object for Pomodoro settings
/// Represents the complete settings configuration
/// </summary>
public class PomodoroSettingsDto
{
    public int WorkDuration { get; set; } = 25; // minutes
    public int BreakDuration { get; set; } = 5; // minutes
    public int LongBreakDuration { get; set; } = 15; // minutes
    public int SessionsUntilLongBreak { get; set; } = 4;
    public bool AutoStartBreaks { get; set; } = false;
    public bool AutoStartPomodoros { get; set; } = false;
    public bool SoundEnabled { get; set; } = true;
}
