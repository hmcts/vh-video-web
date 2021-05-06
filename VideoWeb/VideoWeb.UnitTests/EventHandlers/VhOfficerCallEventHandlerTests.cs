using System;
using System.Linq;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Services;
using VideoWeb.UnitTests.Builders;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.UnitTests.EventHandlers
{
    [TestFixture]
    public class VhOfficerCallEventHandlerTests
    {
        private VhOfficerCallEventHandler _eventHandler;
        private AutoMock _mocker;
        private MemoryCache _memoryCache;
        private ConferenceCache _conferenceCache;
        private Conference _conference;
        
        [SetUp]
        public void SetUp()
        {
            _conference = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();
            _memoryCache = new MemoryCache(new MemoryCacheOptions());
            _conferenceCache = new ConferenceCache(_memoryCache);
            _mocker = AutoMock.GetLoose(builder => builder.RegisterInstance<IConferenceCache>(_conferenceCache));
            _eventHandler = _mocker.Create<VhOfficerCallEventHandler>();
        }

        
        [TestCase(null)]
        [TestCase(RoomType.AdminRoom)]
        [TestCase(RoomType.HearingRoom)]
        [TestCase(RoomType.WaitingRoom)]
        public void Should_throw_exception_when_transfer_to_is_not_a_consultation_room(RoomType? transferTo)
        {
            var participantForEvent = _conference.Participants.First(x => x.Role == Role.Individual);
            _memoryCache.Set(_conference.Id, _conference);

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = _conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferTo = transferTo?.ToString(),
                TimeStampUtc = DateTime.UtcNow
            };

            var exception =
                Assert.ThrowsAsync<ArgumentException>(async () => await _eventHandler.HandleAsync(callbackEvent));
            exception.Message.Should().Be("No consultation room provided");
        }

        [Test]
        public async Task should_send_consultation_message_when_vho_call_starts()
        {
            var participantForEvent = _conference.Participants.First(x => x.Role == Role.Individual);
            _memoryCache.Set(_conference.Id, _conference);
            
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.VhoCall,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = _conference.Id,
                ParticipantId = participantForEvent.Id,
                TransferTo = "ConsultationRoom1",
                TimeStampUtc = DateTime.UtcNow
            };
            
            await _eventHandler.HandleAsync(callbackEvent);
            
            // Verify messages sent to event hub clients
            _mocker.Mock<IConsultationNotifier>().Verify(
                x => x.NotifyConsultationRequestAsync(_conference, callbackEvent.TransferTo, Guid.Empty,
                    _eventHandler.SourceParticipant.Id), Times.Once);
        }


        [Test]
        public async Task should_join_jvs_to_consultation_when_vho_call_starts()
        {
            // Arrange
            var endpointForEvent = _conference.Endpoints.First();
            _memoryCache.Set(_conference.Id,_conference);

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.VhoCall,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = _conference.Id,
                ParticipantId = endpointForEvent.Id,
                TransferTo = "ConsultationRoom1",
                TimeStampUtc = DateTime.UtcNow
            };

            // Act
            await _eventHandler.HandleAsync(callbackEvent);

            // Assert
            _mocker.Mock<IVideoApiClient>().Verify(x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(r => 
            r.ConferenceId == _conference.Id &&
            r.RequestedById == Guid.Empty &&
            r.EndpointId == endpointForEvent.Id &&
            r.RoomLabel == callbackEvent.TransferTo)), Times.Once);
        }
    }
}
