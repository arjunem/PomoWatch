using PomodoroAPI.Models;
using PomodoroAPI.Repositories;

namespace PomodoroAPI.Services;

public class SessionService : ISessionService
{
    private readonly ISessionRepository _sessionRepository;

    public SessionService(ISessionRepository sessionRepository)
    {
        _sessionRepository = sessionRepository;
    }

    public async Task<IEnumerable<Session>> GetAllSessionsAsync()
    {
        return await _sessionRepository.GetAllSessionsAsync();
    }

    public async Task<Session?> GetSessionByIdAsync(int id)
    {
        return await _sessionRepository.GetSessionByIdAsync(id);
    }

    public async Task<Session?> GetActiveSessionAsync()
    {
        return await _sessionRepository.GetActiveSessionAsync();
    }

    public async Task<Session> StartWorkSessionAsync(int durationMinutes = 25)
    {
        // Check if there's already an active session
        var activeSession = await GetActiveSessionAsync();
        if (activeSession != null)
        {
            throw new InvalidOperationException("There is already an active session. Please complete or cancel it first.");
        }

        var session = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow,
            DurationMinutes = durationMinutes,
            Status = "running"
        };

        return await _sessionRepository.CreateSessionAsync(session);
    }

    public async Task<Session> StartBreakSessionAsync(int durationMinutes = 5)
    {
        // Check if there's already an active session
        var activeSession = await GetActiveSessionAsync();
        if (activeSession != null)
        {
            throw new InvalidOperationException("There is already an active session. Please complete or cancel it first.");
        }

        var session = new Session
        {
            Type = "break",
            StartTime = DateTime.UtcNow,
            DurationMinutes = durationMinutes,
            Status = "running"
        };

        return await _sessionRepository.CreateSessionAsync(session);
    }

    public async Task<Session> PauseSessionAsync(int sessionId)
    {
        var session = await _sessionRepository.GetSessionByIdAsync(sessionId);
        if (session == null)
        {
            throw new ArgumentException($"Session with ID {sessionId} not found.");
        }

        if (session.Status != "running")
        {
            throw new InvalidOperationException($"Cannot pause session with status '{session.Status}'.");
        }

        session.Status = "paused";
        session.EndTime = DateTime.UtcNow; // Record when it was paused
        return await _sessionRepository.UpdateSessionAsync(session);
    }

    public async Task<Session> ResumeSessionAsync(int sessionId)
    {
        var session = await _sessionRepository.GetSessionByIdAsync(sessionId);
        if (session == null)
        {
            throw new ArgumentException($"Session with ID {sessionId} not found.");
        }

        if (session.Status != "paused")
        {
            throw new InvalidOperationException($"Cannot resume session with status '{session.Status}'.");
        }

        session.Status = "running";
        session.EndTime = null; // Clear end time since it's running again
        return await _sessionRepository.UpdateSessionAsync(session);
    }

    public async Task<Session> CompleteSessionAsync(int sessionId)
    {
        var session = await _sessionRepository.GetSessionByIdAsync(sessionId);
        if (session == null)
        {
            throw new ArgumentException($"Session with ID {sessionId} not found.");
        }

        if (session.Status != "running" && session.Status != "paused")
        {
            throw new InvalidOperationException($"Cannot complete session with status '{session.Status}'.");
        }

        session.Status = "completed";
        session.EndTime = DateTime.UtcNow;
        return await _sessionRepository.UpdateSessionAsync(session);
    }

    public async Task<Session> CancelSessionAsync(int sessionId)
    {
        var session = await _sessionRepository.GetSessionByIdAsync(sessionId);
        if (session == null)
        {
            throw new ArgumentException($"Session with ID {sessionId} not found.");
        }

        if (session.Status == "completed")
        {
            throw new InvalidOperationException("Cannot cancel a completed session.");
        }

        session.Status = "cancelled";
        session.EndTime = DateTime.UtcNow;
        return await _sessionRepository.UpdateSessionAsync(session);
    }

    public async Task<Session> UpdateSessionAsync(Session session)
    {
        return await _sessionRepository.UpdateSessionAsync(session);
    }

    public async Task<bool> DeleteSessionAsync(int id)
    {
        return await _sessionRepository.DeleteSessionAsync(id);
    }

    public async Task<IEnumerable<Session>> GetSessionsByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _sessionRepository.GetSessionsByDateRangeAsync(startDate, endDate);
    }

    public async Task<IEnumerable<Session>> GetSessionsByTypeAsync(string type)
    {
        return await _sessionRepository.GetSessionsByTypeAsync(type);
    }

    public async Task<Session?> GetCurrentSessionAsync()
    {
        return await _sessionRepository.GetActiveSessionAsync();
    }
}
