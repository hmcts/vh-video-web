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
    public class DistributedConsultationResponseCacheTests
    {
        private AutoMock _mocker;
        private IDistributedCache _distributedCache;
        private DistributedConsultationResponseCache _sut;

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
            _sut = _mocker.Create<DistributedConsultationResponseCache>();
        }
        
        [Test]
        public async Task Should_create_invitation_entry_for_an_invitation_and_update_participant_to_invitation_map()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var roomLabel = "room_label";
            var invitation = new ConsultationInvitation(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            // Act
            await _sut.CreateInvitationEntry(invitation);

            // Assert
            (await ReadFromCache<ConsultationInvitation>(invitation.InvitationId)).Should().BeEquivalentTo(invitation);
            var participantInvitations = (await ReadFromCache<IEnumerable<Guid>>(participantGuid)).ToList();
            participantInvitations.Count().Should().Be(1);
            participantInvitations.First().Should().Be(invitation.InvitationId);
            var linkedParticipantInvitations = (await ReadFromCache<IEnumerable<Guid>>(linkedParticipantGuid)).ToList();
            linkedParticipantInvitations.Count().Should().Be(1);
            linkedParticipantInvitations.First().Should().Be(invitation.InvitationId);
        }

        [Test]
        public async Task Should_get_invitation_entry_for_an_invitation_that_exists()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var roomLabel = "room_label";
            var storedInvitation =
                new ConsultationInvitation(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            await WriteToCache(storedInvitation.InvitationId, storedInvitation);
            
            // Act
            var invitation = await _sut.GetInvitation(storedInvitation.InvitationId);

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
                new ConsultationInvitation(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            // Act
            var invitation = await _sut.GetInvitation(storedInvitation.InvitationId);

            // Assert
            invitation.Should().BeNull();
        }

        [Test]
        public async Task Should_delete_invitation_from_cache_and_delete_participant_entries_in_participant_to_invitation_map_if_there_are_no_more_mappings()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var roomLabel = "room_label";
            var storedInvitation =
                new ConsultationInvitation(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            await WriteToCache(storedInvitation.InvitationId, storedInvitation);
            await WriteToCache(participantGuid, new [] { storedInvitation.InvitationId });
            await WriteToCache(linkedParticipantGuid, new [] { storedInvitation.InvitationId });

            // Act
            await _sut.DeleteInvitationEntry(storedInvitation.InvitationId);

            // Assert
            (await ReadFromCache<ConsultationInvitation>(storedInvitation.InvitationId)).Should().BeNull();
            (await ReadFromCache<IEnumerable<Guid>>(participantGuid)).Should().BeNull();
            (await ReadFromCache<IEnumerable<Guid>>(linkedParticipantGuid)).Should().BeNull();
        }

        [Test]
        public async Task Should_delete_invitation_from_cache_and_update_entries_in_participant_to_invitation_map()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var linkedParticipant2Guid = Guid.NewGuid();
            var roomLabel = "room_label";
            var storedInvitation =
                new ConsultationInvitation(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            await WriteToCache(storedInvitation.InvitationId, storedInvitation);

            var permanentInvitation =
                new ConsultationInvitation(participantGuid, roomLabel, new[] {linkedParticipant2Guid});
            
            await WriteToCache(permanentInvitation.InvitationId, permanentInvitation);
            await WriteToCache(participantGuid, new [] { storedInvitation.InvitationId, permanentInvitation.InvitationId });
            await WriteToCache(linkedParticipantGuid, new [] { storedInvitation.InvitationId});
            await WriteToCache(linkedParticipant2Guid, new [] { permanentInvitation.InvitationId });
            
            // Act
            await _sut.DeleteInvitationEntry(storedInvitation.InvitationId);

            // Assert
            (await ReadFromCache<ConsultationInvitation>(storedInvitation.InvitationId)).Should().BeNull();

            var participantInvitations = (await ReadFromCache<IEnumerable<Guid>>(participantGuid)).ToList();
            participantInvitations.Count().Should().Be(1);
            participantInvitations.First().Should().Be(permanentInvitation.InvitationId);
            
            (await ReadFromCache<IEnumerable<Guid>>(linkedParticipantGuid)).Should().BeNull();

            var linkedParticipant2Invitations = (await ReadFromCache<IEnumerable<Guid>>(linkedParticipant2Guid)).ToList();
            linkedParticipant2Invitations.Count().Should().Be(1);
            linkedParticipant2Invitations.First().Should().Be(permanentInvitation.InvitationId);
        }
        
        [Test]
        public async Task Should_update_an_invitation_if_it_exists()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var roomLabel = "room_label";
            var invitationToUpdate =
                new ConsultationInvitation(participantGuid, roomLabel, new[] {linkedParticipantGuid});
            
            await WriteToCache(invitationToUpdate.InvitationId, invitationToUpdate);
            
            // Act
            await _sut.UpdateResponseToInvitation(invitationToUpdate.InvitationId, linkedParticipantGuid, ConsultationAnswer.Accepted);
            var storedInvitation = await ReadFromCache<ConsultationInvitation>(invitationToUpdate.InvitationId);

            // Assert
            storedInvitation.InvitationId.Should().Be(invitationToUpdate.InvitationId);
            storedInvitation.RequestedForParticipantId.Should().Be(invitationToUpdate.RequestedForParticipantId);
            storedInvitation.RoomLabel.Should().Be(invitationToUpdate.RoomLabel);
            storedInvitation.InvitedParticipantResponses.Count.Should().Be(2);
            storedInvitation.InvitedParticipantResponses[participantGuid].Should().Be(ConsultationAnswer.None);
            storedInvitation.InvitedParticipantResponses[linkedParticipantGuid].Should().Be(ConsultationAnswer.Accepted);
        }
    }
}
