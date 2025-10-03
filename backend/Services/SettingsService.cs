using PomodoroAPI.Repositories;
using PomodoroAPI.Models;

namespace PomodoroAPI.Services;

/// <summary>
/// Service implementation for managing Pomodoro settings business logic
/// Handles settings persistence and provides default values
/// </summary>
public class SettingsService : ISettingsService
{
    private readonly ISettingsRepository _settingsRepository;

    // Default settings values
    private readonly Dictionary<string, string> _defaultSettings = new()
    {
        { "work_duration", "25" },
        { "break_duration", "5" },
        { "long_break_duration", "15" },
        { "sessions_until_long_break", "4" },
        { "auto_start_breaks", "false" },
        { "auto_start_pomodoros", "false" },
        { "sound_enabled", "true" }
    };

    public SettingsService(ISettingsRepository settingsRepository)
    {
        _settingsRepository = settingsRepository;
    }

    /// <summary>
    /// Gets all current Pomodoro settings
    /// Returns default values for any missing settings
    /// </summary>
    public async Task<PomodoroSettingsDto> GetSettingsAsync()
    {
        var settings = new PomodoroSettingsDto();

        // Load each setting from database or use default
        settings.WorkDuration = int.Parse(await GetSettingValueAsync("work_duration", _defaultSettings["work_duration"]));
        settings.BreakDuration = int.Parse(await GetSettingValueAsync("break_duration", _defaultSettings["break_duration"]));
        settings.LongBreakDuration = int.Parse(await GetSettingValueAsync("long_break_duration", _defaultSettings["long_break_duration"]));
        settings.SessionsUntilLongBreak = int.Parse(await GetSettingValueAsync("sessions_until_long_break", _defaultSettings["sessions_until_long_break"]));
        settings.AutoStartBreaks = bool.Parse(await GetSettingValueAsync("auto_start_breaks", _defaultSettings["auto_start_breaks"]));
        settings.AutoStartPomodoros = bool.Parse(await GetSettingValueAsync("auto_start_pomodoros", _defaultSettings["auto_start_pomodoros"]));
        settings.SoundEnabled = bool.Parse(await GetSettingValueAsync("sound_enabled", _defaultSettings["sound_enabled"]));

        return settings;
    }

    /// <summary>
    /// Updates Pomodoro settings
    /// Creates or updates individual setting records
    /// </summary>
    public async Task<PomodoroSettingsDto> UpdateSettingsAsync(PomodoroSettingsDto settings)
    {
        // Update each setting
        await SetSettingValueAsync("work_duration", settings.WorkDuration.ToString());
        await SetSettingValueAsync("break_duration", settings.BreakDuration.ToString());
        await SetSettingValueAsync("long_break_duration", settings.LongBreakDuration.ToString());
        await SetSettingValueAsync("sessions_until_long_break", settings.SessionsUntilLongBreak.ToString());
        await SetSettingValueAsync("auto_start_breaks", settings.AutoStartBreaks.ToString().ToLower());
        await SetSettingValueAsync("auto_start_pomodoros", settings.AutoStartPomodoros.ToString().ToLower());
        await SetSettingValueAsync("sound_enabled", settings.SoundEnabled.ToString().ToLower());

        return settings;
    }

    /// <summary>
    /// Gets a specific setting value by key
    /// </summary>
    public async Task<string> GetSettingValueAsync(string key, string defaultValue = "")
    {
        var setting = await _settingsRepository.GetByKeyAsync(key);
        return setting?.Value ?? defaultValue;
    }

    /// <summary>
    /// Sets a specific setting value by key
    /// </summary>
    public async Task<Settings> SetSettingValueAsync(string key, string value)
    {
        var existingSetting = await _settingsRepository.GetByKeyAsync(key);
        
        if (existingSetting != null)
        {
            existingSetting.Value = value;
            existingSetting.UpdatedAt = DateTime.UtcNow;
            return await _settingsRepository.UpdateAsync(existingSetting);
        }
        else
        {
            var newSetting = new Settings
            {
                Key = key,
                Value = value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            return await _settingsRepository.CreateAsync(newSetting);
        }
    }

    /// <summary>
    /// Resets all settings to default values
    /// </summary>
    public async Task<PomodoroSettingsDto> ResetToDefaultsAsync()
    {
        var defaultSettings = new PomodoroSettingsDto();
        
        // Reset each setting to default
        await SetSettingValueAsync("work_duration", _defaultSettings["work_duration"]);
        await SetSettingValueAsync("break_duration", _defaultSettings["break_duration"]);
        await SetSettingValueAsync("long_break_duration", _defaultSettings["long_break_duration"]);
        await SetSettingValueAsync("sessions_until_long_break", _defaultSettings["sessions_until_long_break"]);
        await SetSettingValueAsync("auto_start_breaks", _defaultSettings["auto_start_breaks"]);
        await SetSettingValueAsync("auto_start_pomodoros", _defaultSettings["auto_start_pomodoros"]);
        await SetSettingValueAsync("sound_enabled", _defaultSettings["sound_enabled"]);
        
        // Set the default values in the DTO
        defaultSettings.WorkDuration = int.Parse(_defaultSettings["work_duration"]);
        defaultSettings.BreakDuration = int.Parse(_defaultSettings["break_duration"]);
        defaultSettings.LongBreakDuration = int.Parse(_defaultSettings["long_break_duration"]);
        defaultSettings.SessionsUntilLongBreak = int.Parse(_defaultSettings["sessions_until_long_break"]);
        defaultSettings.AutoStartBreaks = bool.Parse(_defaultSettings["auto_start_breaks"]);
        defaultSettings.AutoStartPomodoros = bool.Parse(_defaultSettings["auto_start_pomodoros"]);
        defaultSettings.SoundEnabled = bool.Parse(_defaultSettings["sound_enabled"]);

        return defaultSettings;
    }
}
