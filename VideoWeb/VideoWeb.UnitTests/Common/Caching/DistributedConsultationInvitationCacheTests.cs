using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Common.Caching
{
    [TestFixture]
    public class DistributedConsultationInvitationCacheTests
    {
        private AutoMock _mocker;
        private IDistributedCache _distributedCache;
        private DistributedConsultationInvitationCache _sut;

        private async Task WriteToCache<T>(Guid key, T obj) where T : class
        {
            var serialisedObj = JsonConvert.SerializeObject(obj, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedObj);
            await _distributedCache.SetAsync(key.ToString(), data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(4)
                });
        }
        
        private async Task<T> ReadFromCache<T>(Guid key) where T : class
        {
            var data = await _distributedCache.GetAsync(key.ToString());
            return data == null ? null : JsonConvert.DeserializeObject<T>(Encoding.UTF8.GetString(data),
                CachingHelper.SerializerSettings);
        }
        
        [SetUp]
        public void SetUp()
        {
            var opts = Options.Create(new MemoryDistributedCacheOptions());
            _distributedCache = new MemoryDistributedCache(opts);
            _mocker = AutoMock.GetStrict(builder => builder.RegisterInstance(_distributedCache));
            _sut = _mocker.Create<DistributedConsultationInvitationCache>();
        }
        
        [Test]
        public async Task Should_create_invitation_entry_for_an_invitation_and_update_participant_to_invitation_map()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var roomLabel = "room_label";
            var invitation = ConsultationInvitation.Create(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            // Act
            await _sut.Write(invitation);

            // Assert
            (await ReadFromCache<ConsultationInvitation>(invitation.InvitationId)).Should().BeEquivalentTo(invitation);
        }

        [Test]
        public async Task Should_get_invitation_entry_for_an_invitation_that_exists()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var roomLabel = "room_label";
            var storedInvitation = ConsultationInvitation.Create(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            await WriteToCache(storedInvitation.InvitationId, storedInvitation);
            
            // Act
            var invitation = await _sut.Read(storedInvitation.InvitationId);

            // Assert
            invitation.Should().BeEquivalentTo(storedInvitation);
        }

        [Test]
        public async Task Should_get_null_for_an_invitation_that_DOES_NOT_exists()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var roomLabel = "room_label";
            var storedInvitation =
                ConsultationInvitation.Create(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            // Act
            var invitation = await _sut.Read(storedInvitation.InvitationId);

            // Assert
            invitation.Should().BeNull();
        }
    }
}
