using System;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;

namespace VideoWeb.UnitTests.Cache;

[TestFixture]
public class CacheLockTests
{
    private CacheLock _cacheLock;
    private Mock<IDistributedCache> _distributedCacheMock;
    private Mock<ILogger<CacheLock>> _loggerMock;
    private const string LockKey = "cache_lock_key";
    private readonly string _cacheLockValue = JsonSerializer.Serialize("locked", CachingHelper.JsonSerializerOptions);
    
    [SetUp]
    public void Setup()
    {
        _distributedCacheMock = new Mock<IDistributedCache>();
        _loggerMock = new Mock<ILogger<CacheLock>>();
        _cacheLock = new CacheLock(_distributedCacheMock.Object, _loggerMock.Object);
    }
    

    [Test]
    public async Task AcquireLockAsync_ShouldReturnTrue_WhenLockAcquiredSuccessfully()
    {
        // Arrange
        TimeSpan lockExpiry = TimeSpan.FromMinutes(5);
        var expectedResult = Encoding.UTF8.GetBytes(_cacheLockValue);

        _distributedCacheMock
            .Setup(c => c.GetAsync(LockKey, default))
            .ReturnsAsync(expectedResult);

        // Act
        var result = await _cacheLock.AcquireLockAsync(LockKey, lockExpiry);

        // Assert
        result.Should().BeTrue();
    }
    
    [Test]
    public async Task AcquireLockAsync_ShouldReturnFalseAndSetNewLock_WhenNoLockSet()
    {
        // Arrange
        TimeSpan lockExpiry = TimeSpan.FromMinutes(5);
        var expectedResult = Array.Empty<byte>();
        
        _distributedCacheMock
            .Setup(c => c.GetAsync(LockKey, default))
            .ReturnsAsync(expectedResult);
        
        // Act
        var result = await _cacheLock.AcquireLockAsync(LockKey, lockExpiry);
        
        // Assert
        result.Should().BeFalse();
        _cacheLock.CacheEntryOptions.AbsoluteExpiration.Should().BeCloseTo(DateTimeOffset.UtcNow.Add(lockExpiry), TimeSpan.FromSeconds(1));
        _distributedCacheMock.Verify(c
            => c.SetAsync(LockKey, Encoding.UTF8.GetBytes(_cacheLockValue), It.IsAny<DistributedCacheEntryOptions>(), default), Times.Once);
    }

    [Test]
    public async Task ReleaseLockAsync_ShouldDeleteLock_WhenLockExists()
    {
        // Act
        await _cacheLock.ReleaseLockAsync(LockKey);
        
        // Assert
        _distributedCacheMock.Verify(c => c.RemoveAsync(LockKey, default), Times.Once);
    }
}
