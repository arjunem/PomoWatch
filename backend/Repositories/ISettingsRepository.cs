using PomodoroAPI.Models;

namespace PomodoroAPI.Repositories;

/// <summary>
/// Repository interface for managing settings data access
/// Provides abstraction for settings persistence operations
/// </summary>
public interface ISettingsRepository
{
    /// <summary>
    /// Retrieves all settings from the database
    /// </summary>
    /// <returns>Collection of all settings</returns>
    Task<IEnumerable<Settings>> GetAllAsync();

    /// <summary>
    /// Retrieves a specific setting by its key
    /// </summary>
    /// <param name="key">The setting key to search for</param>
    /// <returns>The setting if found, null otherwise</returns>
    Task<Settings?> GetByKeyAsync(string key);

    /// <summary>
    /// Creates a new setting in the database
    /// </summary>
    /// <param name="setting">The setting to create</param>
    /// <returns>The created setting with generated ID</returns>
    Task<Settings> CreateAsync(Settings setting);

    /// <summary>
    /// Updates an existing setting
    /// </summary>
    /// <param name="setting">The setting to update</param>
    /// <returns>The updated setting</returns>
    Task<Settings> UpdateAsync(Settings setting);

    /// <summary>
    /// Deletes a setting by its key
    /// </summary>
    /// <param name="key">The key of the setting to delete</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(string key);

    /// <summary>
    /// Checks if a setting exists with the given key
    /// </summary>
    /// <param name="key">The key to check</param>
    /// <returns>True if exists, false otherwise</returns>
    Task<bool> ExistsAsync(string key);
}
