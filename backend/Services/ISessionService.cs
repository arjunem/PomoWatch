using PomodoroAPI.Models;

namespace PomodoroAPI.Services;

public interface ISessionService
{
    Task<IEnumerable<Session>> GetAllSessionsAsync();
    Task<Session?> GetSessionByIdAsync(int id);
    Task<Session?> GetActiveSessionAsync();
    Task<Session> StartWorkSessionAsync(int durationMinutes = 25);
    Task<Session> StartBreakSessionAsync(int durationMinutes = 5);
    Task<Session> PauseSessionAsync(int sessionId);
    Task<Session> ResumeSessionAsync(int sessionId);
    Task<Session> CompleteSessionAsync(int sessionId);
    Task<Session> CancelSessionAsync(int sessionId);
    Task<Session> UpdateSessionAsync(Session session);
    Task<bool> DeleteSessionAsync(int id);
    Task<IEnumerable<Session>> GetSessionsByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<Session>> GetSessionsByTypeAsync(string type);
    Task<Session?> GetCurrentSessionAsync();
}
