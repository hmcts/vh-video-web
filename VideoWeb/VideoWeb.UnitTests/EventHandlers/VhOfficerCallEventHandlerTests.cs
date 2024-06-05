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
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Services;
using VideoWeb.UnitTests.Builders;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.UnitTests.EventHandlers
{
    [TestFixture]
    public class VhOfficerCallEventHandlerTests : EventHandlerTestBase
    {
        private VhOfficerCallEventHandler _eventHandler;
        private AutoMock _mocker;
        private MemoryCache _memoryCache;
        private ConferenceDto _conferenceDto;
        
        [SetUp]
        public void SetUp()
        {
            _conferenceDto = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();
            _memoryCache = new MemoryCache(new MemoryCacheOptions());
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IConferenceService>()
                .Setup(x => x.ConferenceCache)
                .Returns(new ConferenceCache(_memoryCache));
            _eventHandler = _mocker.Create<VhOfficerCallEventHandler>();
            _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.IsAny<Guid>())).ReturnsAsync(_conferenceDto);
        }
        
        [TestCase(null)]
        [TestCase(RoomType.AdminRoom)]
        [TestCase(RoomType.HearingRoom)]
        [TestCase(RoomType.WaitingRoom)]
        public void Should_throw_exception_when_transfer_to_is_not_a_consultation_room(RoomType? transferTo)
        {
            var participantForEvent = _conferenceDto.Participants.First(x => x.Role == Role.Individual);
            _memoryCache.Set(_conferenceDto.Id, _conferenceDto);

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.Transfer,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = _conferenceDto.Id,
                ParticipantId = participantForEvent.Id,
                TransferTo = transferTo?.ToString(),
                TimeStampUtc = DateTime.UtcNow
            };
            var exception = Assert.ThrowsAsync<ArgumentException>(async () => await _eventHandler.HandleAsync(callbackEvent));
            exception.Message.Should().Be("No consultation room provided");
        }

        [Test]
        public async Task should_send_consultation_message_when_vho_call_starts()
        {
            var participantForEvent = _conferenceDto.Participants.First(x => x.Role == Role.Individual);
            _memoryCache.Set(_conferenceDto.Id, _conferenceDto);
            
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.VhoCall,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = _conferenceDto.Id,
                ParticipantId = participantForEvent.Id,
                TransferTo = "ConsultationRoom1",
                TimeStampUtc = DateTime.UtcNow
            };
            
            await _eventHandler.HandleAsync(callbackEvent);
            
            // Verify messages sent to event hub clients
            _mocker.Mock<IConsultationNotifier>().Verify(
                x => x.NotifyConsultationRequestAsync(_conferenceDto, callbackEvent.TransferTo, Guid.Empty,
                    _eventHandler.SourceParticipantDto.Id), Times.Once);
        }

        [Test]
        public async Task should_join_jvs_to_consultation_when_vho_call_starts()
        {
            // Arrange
            var endpointForEvent = _conferenceDto.Endpoints[0];
            _memoryCache.Set(_conferenceDto.Id,_conferenceDto);

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.VhoCall,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = _conferenceDto.Id,
                ParticipantId = endpointForEvent.Id,
                TransferTo = "ConsultationRoom1",
                TimeStampUtc = DateTime.UtcNow
            };

            // Act
            await _eventHandler.HandleAsync(callbackEvent);

            // Assert
            _mocker.Mock<IVideoApiClient>().Verify(x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(r => 
            r.ConferenceId == _conferenceDto.Id &&
            r.EndpointId == endpointForEvent.Id &&
            r.RoomLabel == callbackEvent.TransferTo)), Times.Once);
        }
    }
}
