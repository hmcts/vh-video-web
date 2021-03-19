using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Services;

namespace VideoWeb.UnitTests.Controllers.VideoEventController
{
    public class SendVmrHearingEventTests : BaseSendHearingEventTests
    {
        [SetUp]
        public void Setup()
        {
            SetupTestConferenceAndMocks();
        }
        
        [Test]
        public async Task should_return_no_content_when_event_is_for_participant_joining_a_room()
        {
            // Arrange
            var request = CreateRequest();
            request.ParticipantRoomId = TestConference.CivilianRooms.First().Id.ToString();

            // Act
            var result = await Sut.SendHearingEventAsync(request);

            // Assert
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_add_participant_to_room_on_join_room_event()
        {
            // Arrange
            var roomId = 999;
            var participantId = TestConference.Participants.Last().Id;
            var request = CreateRequest();
            request.EventType = EventType.Joined;
            request.ParticipantRoomId = roomId.ToString();
            request.ParticipantId = participantId.ToString();
            
            // Act
            var result = await Sut.SendHearingEventAsync(request);
            
            // Assert
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();

            var newCacheRoom = TestConference.CivilianRooms.FirstOrDefault(x => x.Id == roomId);
            newCacheRoom.Should().NotBeNull();
            newCacheRoom?.Participants.Any(x => x == participantId).Should().BeTrue();
        }

        [Test]
        public async Task should_remove_participant_from_room_on_disconnect_event()
        {
            // Arrange
            var request = CreateRequest();
            var room = TestConference.CivilianRooms.First();
            var roomId = room.Id;
            var participantId = room.Participants.First();
            request.ParticipantRoomId = roomId.ToString();
            request.ParticipantId = participantId.ToString();
            request.EventType = EventType.Disconnected;
            
            // Act
            var result = await Sut.SendHearingEventAsync(request);
            
            // Assert
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            Mocker.Mock<IConsultationResponseTracker>()
                .Verify(x => x.ClearResponses(TestConference, participantId), Times.Once);
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();

            var newCacheRoom = TestConference.CivilianRooms.FirstOrDefault(x => x.Id == roomId);
            newCacheRoom.Should().NotBeNull();
            newCacheRoom?.Participants.Any(x => x == participantId).Should().BeFalse();
        }

        [Test]
        public async Task should_publish_transfer_event_to_all_participants_in_room()
        {
            // Arrange
            var room = TestConference.CivilianRooms.First(x => x.Participants.Any());
            var participantCount = room.Participants.Count;

            var request = CreateRequest();
            request.ParticipantId = room.Id.ToString();
            request.ParticipantRoomId = string.Empty;
            request.EventType = EventType.Transfer;
            request.TransferFrom = "WaitingRoom";
            request.TransferTo = "HearingRoom";

            // Act
            var result = await Sut.SendHearingEventAsync(request);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();

            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()),
                Times.Exactly(participantCount));
            Mocker.Mock<IVideoApiClient>().Verify(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()),
                Times.Exactly(participantCount));
        }
    }
}
