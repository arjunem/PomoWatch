namespace PomodoroAPI.Models;

public class Session
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty; // "work" or "break"
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty; // "running", "completed", "cancelled"
}

