using Microsoft.EntityFrameworkCore;
using PomodoroAPI.Data;
using PomodoroAPI.Models;

namespace PomodoroAPI.Repositories;

public class SessionRepository : ISessionRepository
{
    private readonly PomodoroDbContext _context;

    public SessionRepository(PomodoroDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Session>> GetAllSessionsAsync()
    {
        return await _context.Sessions
            .Where(s => !s.IsDeleted)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<Session?> GetSessionByIdAsync(int id)
    {
        return await _context.Sessions
            .Where(s => s.Id == id && !s.IsDeleted)
            .FirstOrDefaultAsync();
    }

    public async Task<Session?> GetActiveSessionAsync()
    {
        return await _context.Sessions
            .Where(s => (s.Status == "running" || s.Status == "paused") && !s.IsDeleted)
            .OrderByDescending(s => s.StartTime)
            .FirstOrDefaultAsync();
    }

    public async Task<Session> CreateSessionAsync(Session session)
    {
        session.CreatedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;
        
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();
        return session;
    }

    public async Task<Session> UpdateSessionAsync(Session session)
    {
        session.UpdatedAt = DateTime.UtcNow;
        session.EnsureUtcTimestamps(); // Ensure all timestamps are UTC
        _context.Entry(session).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return session;
    }

    public async Task<bool> DeleteSessionAsync(int id)
    {
        var session = await _context.Sessions.FindAsync(id);
        if (session == null || session.IsDeleted)
            return false;

        // Soft delete - mark as deleted but keep in database
        session.IsDeleted = true;
        session.DeletedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;
        session.EnsureUtcTimestamps();
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SoftDeleteAllSessionsAsync()
    {
        // Get all sessions except the current running session
        var sessions = await _context.Sessions
            .Where(s => !s.IsDeleted && s.Status != "running")
            .ToListAsync();

        if (!sessions.Any())
            return false;

        foreach (var session in sessions)
        {
            session.IsDeleted = true;
            session.DeletedAt = DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;
            session.EnsureUtcTimestamps();
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<Session>> GetSessionsByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _context.Sessions
            .Where(s => s.StartTime >= startDate && s.StartTime <= endDate && !s.IsDeleted)
            .OrderByDescending(s => s.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Session>> GetSessionsByTypeAsync(string type)
    {
        return await _context.Sessions
            .Where(s => s.Type == type && !s.IsDeleted)
            .OrderByDescending(s => s.StartTime)
            .ToListAsync();
    }
}
