using System.ComponentModel.DataAnnotations;

namespace PomodoroAPI.Models;

public class Settings
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(50)]
    public string Key { get; set; } = string.Empty; // e.g., "work_duration", "break_duration", "long_break_duration"
    
    [Required]
    public string Value { get; set; } = string.Empty; // JSON string or simple value
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
