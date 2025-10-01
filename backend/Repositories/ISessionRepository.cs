using PomodoroAPI.Models;

namespace PomodoroAPI.Repositories;

public interface ISessionRepository
{
    Task<IEnumerable<Session>> GetAllSessionsAsync();
    Task<Session?> GetSessionByIdAsync(int id);
    Task<Session?> GetActiveSessionAsync();
    Task<Session> CreateSessionAsync(Session session);
    Task<Session> UpdateSessionAsync(Session session);
    Task<bool> DeleteSessionAsync(int id);
    Task<bool> SoftDeleteAllSessionsAsync();
    Task<IEnumerable<Session>> GetSessionsByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<Session>> GetSessionsByTypeAsync(string type);
}
