using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PomodoroAPI.Controllers;
using PomodoroAPI.Models;
using PomodoroAPI.Services;
using Xunit;

namespace PomodoroAPI.Tests.Controllers;

public class SessionsControllerTests
{
    private readonly Mock<ISessionService> _mockSessionService;
    private readonly Mock<ILogger<SessionsController>> _mockLogger;
    private readonly SessionsController _controller;

    public SessionsControllerTests()
    {
        _mockSessionService = new Mock<ISessionService>();
        _mockLogger = new Mock<ILogger<SessionsController>>();
        _controller = new SessionsController(_mockSessionService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetSessions_ShouldReturnAllSessions()
    {
        // Arrange
        var expectedSessions = new List<Session>
        {
            new() { Id = 1, Type = "work", Status = "completed" },
            new() { Id = 2, Type = "break", Status = "completed" }
        };
        _mockSessionService.Setup(x => x.GetAllSessionsAsync()).ReturnsAsync(expectedSessions);

        // Act
        var result = await _controller.GetSessions();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var sessions = okResult.Value.Should().BeAssignableTo<IEnumerable<Session>>().Subject;
        sessions.Should().BeEquivalentTo(expectedSessions);
    }

    [Fact]
    public async Task GetSession_WithValidId_ShouldReturnSession()
    {
        // Arrange
        var sessionId = 1;
        var expectedSession = new Session { Id = sessionId, Type = "work", Status = "completed" };
        _mockSessionService.Setup(x => x.GetSessionByIdAsync(sessionId)).ReturnsAsync(expectedSession);

        // Act
        var result = await _controller.GetSession(sessionId);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var session = okResult.Value.Should().BeOfType<Session>().Subject;
        session.Should().BeEquivalentTo(expectedSession);
    }

    [Fact]
    public async Task GetSession_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var sessionId = 999;
        _mockSessionService.Setup(x => x.GetSessionByIdAsync(sessionId)).ReturnsAsync((Session?)null);

        // Act
        var result = await _controller.GetSession(sessionId);

        // Assert
        var notFoundResult = result.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.Value.Should().Be($"Session with ID {sessionId} not found");
    }

    [Fact]
    public async Task GetActiveSession_WithActiveSession_ShouldReturnSession()
    {
        // Arrange
        var activeSession = new Session { Id = 1, Type = "work", Status = "running" };
        _mockSessionService.Setup(x => x.GetActiveSessionAsync()).ReturnsAsync(activeSession);

        // Act
        var result = await _controller.GetActiveSession();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var session = okResult.Value.Should().BeOfType<Session>().Subject;
        session.Should().BeEquivalentTo(activeSession);
    }

    [Fact]
    public async Task GetActiveSession_WithNoActiveSession_ShouldReturnNotFound()
    {
        // Arrange
        _mockSessionService.Setup(x => x.GetActiveSessionAsync()).ReturnsAsync((Session?)null);

        // Act
        var result = await _controller.GetActiveSession();

        // Assert
        var notFoundResult = result.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.Value.Should().Be("No active session found");
    }

    [Fact]
    public async Task StartWorkSession_ShouldCreateWorkSession()
    {
        // Arrange
        var request = new StartSessionRequest { DurationMinutes = 25 };
        var createdSession = new Session
        {
            Id = 1,
            Type = "work",
            DurationMinutes = 25,
            Status = "running"
        };
        _mockSessionService.Setup(x => x.StartWorkSessionAsync(25)).ReturnsAsync(createdSession);

        // Act
        var result = await _controller.StartWorkSession(request);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be("GetSession");
        createdResult.RouteValues!["id"].Should().Be(1);
        var session = createdResult.Value.Should().BeOfType<Session>().Subject;
        session.Type.Should().Be("work");
    }

    [Fact]
    public async Task StartWorkSession_WithActiveSession_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new StartSessionRequest { DurationMinutes = 25 };
        _mockSessionService.Setup(x => x.StartWorkSessionAsync(25))
                          .ThrowsAsync(new InvalidOperationException("There is already an active session"));

        // Act
        var result = await _controller.StartWorkSession(request);

        // Assert
        var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.Value.Should().Be("There is already an active session");
    }

    [Fact]
    public async Task StartBreakSession_ShouldCreateBreakSession()
    {
        // Arrange
        var request = new StartSessionRequest { DurationMinutes = 5 };
        var createdSession = new Session
        {
            Id = 1,
            Type = "break",
            DurationMinutes = 5,
            Status = "running"
        };
        _mockSessionService.Setup(x => x.StartBreakSessionAsync(5)).ReturnsAsync(createdSession);

        // Act
        var result = await _controller.StartBreakSession(request);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var session = createdResult.Value.Should().BeOfType<Session>().Subject;
        session.Type.Should().Be("break");
    }

    [Fact]
    public async Task PauseSession_WithValidSession_ShouldPauseSession()
    {
        // Arrange
        var sessionId = 1;
        var pausedSession = new Session { Id = sessionId, Status = "paused" };
        _mockSessionService.Setup(x => x.PauseSessionAsync(sessionId)).ReturnsAsync(pausedSession);

        // Act
        var result = await _controller.PauseSession(sessionId);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var session = okResult.Value.Should().BeOfType<Session>().Subject;
        session.Status.Should().Be("paused");
    }

    [Fact]
    public async Task PauseSession_WithInvalidSession_ShouldReturnNotFound()
    {
        // Arrange
        var sessionId = 999;
        _mockSessionService.Setup(x => x.PauseSessionAsync(sessionId))
                          .ThrowsAsync(new ArgumentException($"Session with ID {sessionId} not found."));

        // Act
        var result = await _controller.PauseSession(sessionId);

        // Assert
        var notFoundResult = result.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.Value.Should().Be($"Session with ID {sessionId} not found.");
    }

    [Fact]
    public async Task CompleteSession_WithValidSession_ShouldCompleteSession()
    {
        // Arrange
        var sessionId = 1;
        var completedSession = new Session { Id = sessionId, Status = "completed" };
        _mockSessionService.Setup(x => x.CompleteSessionAsync(sessionId)).ReturnsAsync(completedSession);

        // Act
        var result = await _controller.CompleteSession(sessionId);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var session = okResult.Value.Should().BeOfType<Session>().Subject;
        session.Status.Should().Be("completed");
    }

    [Fact]
    public async Task CancelSession_WithValidSession_ShouldCancelSession()
    {
        // Arrange
        var sessionId = 1;
        var cancelledSession = new Session { Id = sessionId, Status = "cancelled" };
        _mockSessionService.Setup(x => x.CancelSessionAsync(sessionId)).ReturnsAsync(cancelledSession);

        // Act
        var result = await _controller.CancelSession(sessionId);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var session = okResult.Value.Should().BeOfType<Session>().Subject;
        session.Status.Should().Be("cancelled");
    }

    [Fact]
    public async Task DeleteSession_WithValidId_ShouldDeleteSession()
    {
        // Arrange
        var sessionId = 1;
        _mockSessionService.Setup(x => x.DeleteSessionAsync(sessionId)).ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteSession(sessionId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteSession_WithInvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var sessionId = 999;
        _mockSessionService.Setup(x => x.DeleteSessionAsync(sessionId)).ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteSession(sessionId);

        // Assert
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.Value.Should().Be($"Session with ID {sessionId} not found");
    }

    [Fact]
    public async Task GetSessionsByDateRange_ShouldReturnSessionsInRange()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date;
        var endDate = DateTime.UtcNow.Date.AddDays(1);
        var sessions = new List<Session>
        {
            new() { Id = 1, Type = "work", StartTime = DateTime.UtcNow }
        };
        _mockSessionService.Setup(x => x.GetSessionsByDateRangeAsync(startDate, endDate))
                          .ReturnsAsync(sessions);

        // Act
        var result = await _controller.GetSessionsByDateRange(startDate, endDate);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var resultSessions = okResult.Value.Should().BeAssignableTo<IEnumerable<Session>>().Subject;
        resultSessions.Should().BeEquivalentTo(sessions);
    }

    [Fact]
    public async Task GetSessionsByType_WithValidType_ShouldReturnSessionsOfType()
    {
        // Arrange
        var type = "work";
        var sessions = new List<Session>
        {
            new() { Id = 1, Type = "work", Status = "completed" }
        };
        _mockSessionService.Setup(x => x.GetSessionsByTypeAsync(type)).ReturnsAsync(sessions);

        // Act
        var result = await _controller.GetSessionsByType(type);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var resultSessions = okResult.Value.Should().BeAssignableTo<IEnumerable<Session>>().Subject;
        resultSessions.Should().BeEquivalentTo(sessions);
    }

    [Fact]
    public async Task GetSessionsByType_WithInvalidType_ShouldReturnBadRequest()
    {
        // Arrange
        var type = "invalid";

        // Act
        var result = await _controller.GetSessionsByType(type);

        // Assert
        var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.Value.Should().Be("Type must be either 'work' or 'break'");
    }
}
