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
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<Session?> GetSessionByIdAsync(int id)
    {
        return await _context.Sessions.FindAsync(id);
    }

    public async Task<Session?> GetActiveSessionAsync()
    {
        return await _context.Sessions
            .Where(s => s.Status == "running" || s.Status == "paused")
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
        _context.Entry(session).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return session;
    }

    public async Task<bool> DeleteSessionAsync(int id)
    {
        var session = await _context.Sessions.FindAsync(id);
        if (session == null)
            return false;

        _context.Sessions.Remove(session);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<Session>> GetSessionsByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _context.Sessions
            .Where(s => s.StartTime >= startDate && s.StartTime <= endDate)
            .OrderByDescending(s => s.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Session>> GetSessionsByTypeAsync(string type)
    {
        return await _context.Sessions
            .Where(s => s.Type == type)
            .OrderByDescending(s => s.StartTime)
            .ToListAsync();
    }
}
