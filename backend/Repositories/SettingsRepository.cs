using Microsoft.EntityFrameworkCore;
using PomodoroAPI.Data;
using PomodoroAPI.Models;

namespace PomodoroAPI.Repositories;

/// <summary>
/// Repository implementation for managing settings data access
/// Handles all database operations for settings persistence
/// </summary>
public class SettingsRepository : ISettingsRepository
{
    private readonly PomodoroDbContext _context;

    public SettingsRepository(PomodoroDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Retrieves all settings from the database
    /// </summary>
    public async Task<IEnumerable<Settings>> GetAllAsync()
    {
        return await _context.Settings
            .OrderBy(s => s.Key)
            .ToListAsync();
    }

    /// <summary>
    /// Retrieves a specific setting by its key
    /// </summary>
    public async Task<Settings?> GetByKeyAsync(string key)
    {
        return await _context.Settings
            .FirstOrDefaultAsync(s => s.Key == key);
    }

    /// <summary>
    /// Creates a new setting in the database
    /// </summary>
    public async Task<Settings> CreateAsync(Settings setting)
    {
        setting.CreatedAt = DateTime.UtcNow;
        setting.UpdatedAt = DateTime.UtcNow;

        _context.Settings.Add(setting);
        await _context.SaveChangesAsync();
        return setting;
    }

    /// <summary>
    /// Updates an existing setting
    /// </summary>
    public async Task<Settings> UpdateAsync(Settings setting)
    {
        setting.UpdatedAt = DateTime.UtcNow;
        
        _context.Settings.Update(setting);
        await _context.SaveChangesAsync();
        return setting;
    }

    /// <summary>
    /// Deletes a setting by its key
    /// </summary>
    public async Task<bool> DeleteAsync(string key)
    {
        var setting = await GetByKeyAsync(key);
        if (setting == null)
            return false;

        _context.Settings.Remove(setting);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Checks if a setting exists with the given key
    /// </summary>
    public async Task<bool> ExistsAsync(string key)
    {
        return await _context.Settings
            .AnyAsync(s => s.Key == key);
    }
}
