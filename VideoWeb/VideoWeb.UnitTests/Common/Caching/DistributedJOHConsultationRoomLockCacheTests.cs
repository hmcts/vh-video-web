﻿using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Moq;
using Newtonsoft.Json;
using NUnit.Framework;
using VideoWeb.Common.Caching;

namespace VideoWeb.UnitTests.Common.Caching
{
    public class DistributedJOHConsultationRoomLockCacheTests
    {
        private Mock<IDistributedCache> _distributedCacheMock;
        private DistributedJOHConsultationRoomLockCache _distributedJohConsultationRoomLockCache;
        
        [SetUp]
        public void Setup()
        {
            _distributedCacheMock = new Mock<IDistributedCache>();
            _distributedJohConsultationRoomLockCache =
                new DistributedJOHConsultationRoomLockCache(_distributedCacheMock.Object);
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
            var result = await _distributedJohConsultationRoomLockCache.IsJOHRoomLocked(keyName);

            result.Should().Be(expectedIsLockedValue);
        }
        
        private static JsonSerializerSettings SerializerSettings => new JsonSerializerSettings
        {
            TypeNameHandling = TypeNameHandling.Objects, Formatting = Formatting.None
        };
    }
}