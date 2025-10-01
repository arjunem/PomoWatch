using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using PomodoroAPI.Data;
using PomodoroAPI.Models;
using PomodoroAPI.Repositories;
using Xunit;

namespace PomodoroAPI.Tests.Repositories;

public class SessionRepositoryTests : IDisposable
{
    private readonly PomodoroDbContext _context;
    private readonly SessionRepository _repository;

    public SessionRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<PomodoroDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new PomodoroDbContext(options);
        _repository = new SessionRepository(_context);
    }

    [Fact]
    public async Task CreateSessionAsync_ShouldAddSessionToDatabase()
    {
        // Arrange
        var session = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow,
            DurationMinutes = 25,
            Status = "running"
        };

        // Act
        var result = await _repository.CreateSessionAsync(session);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        var savedSession = await _context.Sessions.FindAsync(result.Id);
        savedSession.Should().NotBeNull();
        savedSession!.Type.Should().Be("work");
    }

    [Fact]
    public async Task GetSessionByIdAsync_WithExistingId_ShouldReturnSession()
    {
        // Arrange
        var session = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow,
            Status = "completed"
        };
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetSessionByIdAsync(session.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(session.Id);
        result.Type.Should().Be("work");
    }

    [Fact]
    public async Task GetSessionByIdAsync_WithNonExistingId_ShouldReturnNull()
    {
        // Act
        var result = await _repository.GetSessionByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetActiveSessionAsync_ShouldReturnRunningSession()
    {
        // Arrange
        var runningSession = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow.AddMinutes(-10),
            Status = "running"
        };
        var completedSession = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow.AddMinutes(-30),
            Status = "completed"
        };

        _context.Sessions.AddRange(runningSession, completedSession);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetActiveSessionAsync();

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(runningSession.Id);
        result.Status.Should().Be("running");
    }

    [Fact]
    public async Task GetActiveSessionAsync_WithPausedSession_ShouldReturnPausedSession()
    {
        // Arrange
        var pausedSession = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow.AddMinutes(-10),
            Status = "paused"
        };

        _context.Sessions.Add(pausedSession);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetActiveSessionAsync();

        // Assert
        result.Should().NotBeNull();
        result!.Status.Should().Be("paused");
    }

    [Fact]
    public async Task UpdateSessionAsync_ShouldUpdateExistingSession()
    {
        // Arrange
        var session = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow.AddMinutes(-10),
            Status = "running"
        };
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        // Act
        session.Status = "completed";
        session.EndTime = DateTime.UtcNow;
        var result = await _repository.UpdateSessionAsync(session);

        // Assert
        result.Status.Should().Be("completed");
        result.EndTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        var updatedSession = await _context.Sessions.FindAsync(session.Id);
        updatedSession!.Status.Should().Be("completed");
    }

    [Fact]
    public async Task DeleteSessionAsync_WithExistingId_ShouldRemoveSession()
    {
        // Arrange
        var session = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow,
            Status = "completed"
        };
        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.DeleteSessionAsync(session.Id);

        // Assert
        result.Should().BeTrue();

        var deletedSession = await _context.Sessions.FindAsync(session.Id);
        deletedSession.Should().BeNull();
    }

    [Fact]
    public async Task DeleteSessionAsync_WithNonExistingId_ShouldReturnFalse()
    {
        // Act
        var result = await _repository.DeleteSessionAsync(999);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetSessionsByDateRangeAsync_ShouldReturnSessionsInRange()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date;
        var endDate = DateTime.UtcNow.Date.AddDays(1);

        var sessionInRange = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow,
            Status = "completed"
        };
        var sessionOutOfRange = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow.AddDays(-2),
            Status = "completed"
        };

        _context.Sessions.AddRange(sessionInRange, sessionOutOfRange);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetSessionsByDateRangeAsync(startDate, endDate);

        // Assert
        result.Should().HaveCount(1);
        result.First().Id.Should().Be(sessionInRange.Id);
    }

    [Fact]
    public async Task GetSessionsByTypeAsync_ShouldReturnSessionsOfSpecifiedType()
    {
        // Arrange
        var workSession = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow,
            Status = "completed"
        };
        var breakSession = new Session
        {
            Type = "break",
            StartTime = DateTime.UtcNow,
            Status = "completed"
        };

        _context.Sessions.AddRange(workSession, breakSession);
        await _context.SaveChangesAsync();

        // Act
        var workSessions = await _repository.GetSessionsByTypeAsync("work");
        var breakSessions = await _repository.GetSessionsByTypeAsync("break");

        // Assert
        workSessions.Should().HaveCount(1);
        workSessions.First().Type.Should().Be("work");

        breakSessions.Should().HaveCount(1);
        breakSessions.First().Type.Should().Be("break");
    }

    [Fact]
    public async Task GetAllSessionsAsync_ShouldReturnSessionsOrderedByCreatedAtDescending()
    {
        // Arrange
        var olderSession = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow.AddHours(-2),
            Status = "completed",
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };
        var newerSession = new Session
        {
            Type = "work",
            StartTime = DateTime.UtcNow.AddHours(-1),
            Status = "completed",
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };

        _context.Sessions.AddRange(olderSession, newerSession);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllSessionsAsync();

        // Assert
        result.Should().HaveCount(2);
        result.First().Id.Should().Be(newerSession.Id); // Newer first
        result.Last().Id.Should().Be(olderSession.Id); // Older last
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
