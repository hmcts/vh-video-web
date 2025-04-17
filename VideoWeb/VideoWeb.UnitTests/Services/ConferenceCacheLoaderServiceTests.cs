using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using Moq;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Configuration;
using VideoWeb.Services;

namespace VideoWeb.UnitTests.Services;

[TestFixture]
public class ConferenceCacheLoaderServiceTests
{
    private Mock<ICacheLock> _cacheLock;
    private Mock<IConferenceService> _conferenceService;
    private Mock<ILogger<ConferenceLoaderService>> _logger;
    private IConferenceLoaderService _service;
    private const string LockKey = "conference_data_loader_lock";
    private TimeSpan _expiry;

    [SetUp]
    public void Setup()
    {
        _cacheLock = new Mock<ICacheLock>();
        _conferenceService = new Mock<IConferenceService>();
        _logger = new Mock<ILogger<ConferenceLoaderService>>();
        var cacheSettings = new CacheSettings { LockDuration = 3 };
        _expiry = TimeSpan.FromHours(cacheSettings.LockDuration);
        _logger.Setup(x => x.IsEnabled(LogLevel.Error)).Returns(true);
        _logger.Setup(x => x.IsEnabled(LogLevel.Warning)).Returns(true);
        _logger.Setup(x => x.IsEnabled(LogLevel.Information)).Returns(true);
        _service = new ConferenceLoaderService(
            _cacheLock.Object,
            _conferenceService.Object,
            _logger.Object,
            cacheSettings);
    }

    [Test]
    public async Task LoadDailyConferencesRoutine_Should_Execute_Task_When_No_Lock()
    {
        // Arrange
        _cacheLock.Setup(m => m.AcquireLockAsync(LockKey, _expiry)).ReturnsAsync(false);
        _conferenceService
            .Setup(s => s.PopulateConferenceCacheForToday(default))
            .Returns(Task.CompletedTask);

        // Act       
        await _service.LoadDailyConferencesRoutine(default);

        // Assert
        _conferenceService.Verify(s => s.PopulateConferenceCacheForToday(default), Times.Once);
        _cacheLock.Verify(l => l.AcquireLockAsync(LockKey, _expiry), Times.Once);
        VerifyLog("Populating Conference Cache", Times.Once());
        VerifyLog("Lock released", Times.Once());
    }

    [Test]
    public async Task LoadDailyConferencesRoutine_Should_Not_Execute_Task_When_Locked()
    {
        // Arrange
        _cacheLock.Setup(m => m.AcquireLockAsync(LockKey, _expiry)).ReturnsAsync(true);

        // Act       
        await _service.LoadDailyConferencesRoutine(default);

        // Assert
        _conferenceService.Verify(s => s.PopulateConferenceCacheForToday(default), Times.Never);
        _cacheLock.Verify(l => l.AcquireLockAsync(LockKey, _expiry), Times.Once);
        VerifyLog("Another VideoWeb instance is already processing the job", Times.Once());
    }

    [Test]
    public async Task LoadDailyConferencesRoutine_Should_Log_Error_When_Exception_Occurs()
    {
        // Arrange
        _cacheLock.Setup(m => m.AcquireLockAsync(LockKey, _expiry)).ReturnsAsync(false);
        _conferenceService.Setup(s => s.PopulateConferenceCacheForToday(default)).ThrowsAsync(new Exception("Something messed up error"));

        // Act       
        await _service.LoadDailyConferencesRoutine(default);

        // Assert
        VerifyLog("Error occurred while executing PopulateConferenceCacheForToday", Times.Once(), LogLevel.Error);
    }

    private void VerifyLog(string message, Times times, LogLevel level = LogLevel.Information)
    {
        _logger.Verify(
            x => x.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString().Contains(message)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()), times);
    }
}
