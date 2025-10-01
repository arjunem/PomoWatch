using System.ComponentModel.DataAnnotations;

namespace PomodoroAPI.Models;

public class Session
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(20)]
    public string Type { get; set; } = string.Empty; // "work" or "break"
    
    [Required]
    public DateTime StartTime { get; set; }
    
    public DateTime? EndTime { get; set; } // Nullable for running sessions
    
    [Required]
    [StringLength(20)]
    public string Status { get; set; } = string.Empty; // "running", "completed", "cancelled", "paused"
    
    public int DurationMinutes { get; set; } = 25; // Default 25 minutes for work sessions
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
}

