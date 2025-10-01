using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using PomodoroAPI.Data;
using PomodoroAPI.Models;
using PomodoroAPI.Repositories;
using PomodoroAPI.Services;
using Xunit;

namespace PomodoroAPI.Tests.Services;

public class SessionServiceTests : IDisposable
{
    private readonly PomodoroDbContext _context;
    private readonly SessionService _sessionService;
    private readonly Mock<ISessionRepository> _mockRepository;

    public SessionServiceTests()
    {
        var options = new DbContextOptionsBuilder<PomodoroDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new PomodoroDbContext(options);
        _mockRepository = new Mock<ISessionRepository>();
        _sessionService = new SessionService(_mockRepository.Object);
    }

    [Fact]
    public async Task StartWorkSessionAsync_ShouldCreateNewWorkSession()
    {
        // Arrange
        var durationMinutes = 25;
        var expectedSession = new Session
        {
            Id = 1,
            Type = "work",
            StartTime = DateTime.UtcNow,
            DurationMinutes = durationMinutes,
            Status = "running"
        };

        _mockRepository.Setup(x => x.GetActiveSessionAsync()).ReturnsAsync((Session?)null);
        _mockRepository.Setup(x => x.CreateSessionAsync(It.IsAny<Session>()))
                      .ReturnsAsync(expectedSession);

        // Act
        var result = await _sessionService.StartWorkSessionAsync(durationMinutes);

        // Assert
        result.Should().NotBeNull();
        result.Type.Should().Be("work");
        result.DurationMinutes.Should().Be(durationMinutes);
        result.Status.Should().Be("running");
        result.StartTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

        _mockRepository.Verify(x => x.GetActiveSessionAsync(), Times.Once);
        _mockRepository.Verify(x => x.CreateSessionAsync(It.Is<Session>(s => 
            s.Type == "work" && s.DurationMinutes == durationMinutes && s.Status == "running")), Times.Once);
    }

    [Fact]
    public async Task StartWorkSessionAsync_WhenActiveSessionExists_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var activeSession = new Session { Id = 1, Status = "running" };
        _mockRepository.Setup(x => x.GetActiveSessionAsync()).ReturnsAsync(activeSession);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sessionService.StartWorkSessionAsync(25));
    }

    [Fact]
    public async Task StartBreakSessionAsync_ShouldCreateNewBreakSession()
    {
        // Arrange
        var durationMinutes = 5;
        var expectedSession = new Session
        {
            Id = 1,
            Type = "break",
            StartTime = DateTime.UtcNow,
            DurationMinutes = durationMinutes,
            Status = "running"
        };

        _mockRepository.Setup(x => x.GetActiveSessionAsync()).ReturnsAsync((Session?)null);
        _mockRepository.Setup(x => x.CreateSessionAsync(It.IsAny<Session>()))
                      .ReturnsAsync(expectedSession);

        // Act
        var result = await _sessionService.StartBreakSessionAsync(durationMinutes);

        // Assert
        result.Should().NotBeNull();
        result.Type.Should().Be("break");
        result.DurationMinutes.Should().Be(durationMinutes);
        result.Status.Should().Be("running");
    }

    [Fact]
    public async Task PauseSessionAsync_WithValidRunningSession_ShouldPauseSession()
    {
        // Arrange
        var sessionId = 1;
        var session = new Session
        {
            Id = sessionId,
            Status = "running",
            StartTime = DateTime.UtcNow.AddMinutes(-10)
        };

        _mockRepository.Setup(x => x.GetSessionByIdAsync(sessionId)).ReturnsAsync(session);
        _mockRepository.Setup(x => x.UpdateSessionAsync(It.IsAny<Session>()))
                      .ReturnsAsync((Session updatedSession) => updatedSession);

        // Act
        var result = await _sessionService.PauseSessionAsync(sessionId);

        // Assert
        result.Status.Should().Be("paused");
        result.EndTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        
        _mockRepository.Verify(x => x.UpdateSessionAsync(It.Is<Session>(s => 
            s.Status == "paused" && s.EndTime.HasValue)), Times.Once);
    }

    [Fact]
    public async Task PauseSessionAsync_WithNonRunningSession_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var sessionId = 1;
        var session = new Session { Id = sessionId, Status = "completed" };
        _mockRepository.Setup(x => x.GetSessionByIdAsync(sessionId)).ReturnsAsync(session);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sessionService.PauseSessionAsync(sessionId));
    }

    [Fact]
    public async Task ResumeSessionAsync_WithValidPausedSession_ShouldResumeSession()
    {
        // Arrange
        var sessionId = 1;
        var session = new Session
        {
            Id = sessionId,
            Status = "paused",
            EndTime = DateTime.UtcNow.AddMinutes(-5)
        };

        _mockRepository.Setup(x => x.GetSessionByIdAsync(sessionId)).ReturnsAsync(session);
        _mockRepository.Setup(x => x.UpdateSessionAsync(It.IsAny<Session>()))
                      .ReturnsAsync((Session updatedSession) => updatedSession);

        // Act
        var result = await _sessionService.ResumeSessionAsync(sessionId);

        // Assert
        result.Status.Should().Be("running");
        result.EndTime.Should().BeNull();
        
        _mockRepository.Verify(x => x.UpdateSessionAsync(It.Is<Session>(s => 
            s.Status == "running" && !s.EndTime.HasValue)), Times.Once);
    }

    [Fact]
    public async Task CompleteSessionAsync_WithValidSession_ShouldCompleteSession()
    {
        // Arrange
        var sessionId = 1;
        var session = new Session { Id = sessionId, Status = "running" };
        _mockRepository.Setup(x => x.GetSessionByIdAsync(sessionId)).ReturnsAsync(session);
        _mockRepository.Setup(x => x.UpdateSessionAsync(It.IsAny<Session>()))
                      .ReturnsAsync((Session updatedSession) => updatedSession);

        // Act
        var result = await _sessionService.CompleteSessionAsync(sessionId);

        // Assert
        result.Status.Should().Be("completed");
        result.EndTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task CancelSessionAsync_WithValidSession_ShouldCancelSession()
    {
        // Arrange
        var sessionId = 1;
        var session = new Session { Id = sessionId, Status = "running" };
        _mockRepository.Setup(x => x.GetSessionByIdAsync(sessionId)).ReturnsAsync(session);
        _mockRepository.Setup(x => x.UpdateSessionAsync(It.IsAny<Session>()))
                      .ReturnsAsync((Session updatedSession) => updatedSession);

        // Act
        var result = await _sessionService.CancelSessionAsync(sessionId);

        // Assert
        result.Status.Should().Be("cancelled");
        result.EndTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task CancelSessionAsync_WithCompletedSession_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var sessionId = 1;
        var session = new Session { Id = sessionId, Status = "completed" };
        _mockRepository.Setup(x => x.GetSessionByIdAsync(sessionId)).ReturnsAsync(session);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _sessionService.CancelSessionAsync(sessionId));
    }

    [Fact]
    public async Task GetActiveSessionAsync_ShouldReturnActiveSession()
    {
        // Arrange
        var expectedSession = new Session { Id = 1, Status = "running" };
        _mockRepository.Setup(x => x.GetActiveSessionAsync()).ReturnsAsync(expectedSession);

        // Act
        var result = await _sessionService.GetActiveSessionAsync();

        // Assert
        result.Should().Be(expectedSession);
    }

    [Fact]
    public async Task GetAllSessionsAsync_ShouldReturnAllSessions()
    {
        // Arrange
        var expectedSessions = new List<Session>
        {
            new() { Id = 1, Type = "work", Status = "completed" },
            new() { Id = 2, Type = "break", Status = "completed" }
        };
        _mockRepository.Setup(x => x.GetAllSessionsAsync()).ReturnsAsync(expectedSessions);

        // Act
        var result = await _sessionService.GetAllSessionsAsync();

        // Assert
        result.Should().BeEquivalentTo(expectedSessions);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
