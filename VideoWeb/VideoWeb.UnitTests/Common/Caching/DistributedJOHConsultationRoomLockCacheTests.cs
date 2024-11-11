using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using Newtonsoft.Json;
using NUnit.Framework;
using VideoWeb.Common.Caching;

namespace VideoWeb.UnitTests.Common.Caching
{
    public class DistributedJOHConsultationRoomLockCacheTests
    {
        private Mock<IDistributedCache> _distributedCacheMock;
        private DistributedJohConsultationRoomLockCache _distributedJohConsultationRoomLockCache;
        private Mock<ILogger<DistributedJohConsultationRoomLockCache>> _loggerMock;
        
        [SetUp]
        public void Setup()
        {
            _distributedCacheMock = new Mock<IDistributedCache>();
            _loggerMock = new Mock<ILogger<DistributedJohConsultationRoomLockCache>>();
            _distributedJohConsultationRoomLockCache =
                new DistributedJohConsultationRoomLockCache(_distributedCacheMock.Object, _loggerMock.Object);
        }

        [Test]
        public async Task Updates_Cache_Value()
        {
            var keyName = "KeyName";
            var expectedIsLockedValue = true;
            
            var serialized = JsonConvert.SerializeObject(expectedIsLockedValue, SerializerSettings);
            var rawData = Encoding.UTF8.GetBytes(serialized);
            _distributedCacheMock.Setup(x => x.GetAsync(keyName, CancellationToken.None)).ReturnsAsync(rawData);

            await _distributedJohConsultationRoomLockCache.UpdateJohConsultationRoomLockStatus(expectedIsLockedValue,
                keyName);            
            var result = await _distributedJohConsultationRoomLockCache.IsJohRoomLocked(keyName);

            result.Should().Be(expectedIsLockedValue);
        }
        
        private static JsonSerializerSettings SerializerSettings => new JsonSerializerSettings
        {
            TypeNameHandling = TypeNameHandling.Objects, Formatting = Formatting.None
        };
    }
}
