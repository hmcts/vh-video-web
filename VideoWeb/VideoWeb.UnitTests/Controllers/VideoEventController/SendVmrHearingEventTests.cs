using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;

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
        public async Task should_raise_transfer_event_when_participant_joins_and_other_vmr_participants_are_in_consultation()
        {
            // Arrange
            var vmr = TestConference.CivilianRooms.First(x => x.Participants.Any());
            vmr.Participants.ForEach(x => TestConference.Participants.First(y => y.Id == x).ParticipantStatus = ParticipantStatus.InConsultation);
            
            var finalParticipantCount = vmr.Participants.Count + 1;
            var roomId = vmr.Id;
            var participantId = TestConference.Participants.Last().Id;
            var request = CreateRequest();
            var consultationRoomId = 1234;
            var consultationRoomLabel = "ConsultationRoom1";
            request.EventType = EventType.Joined;
            request.ParticipantRoomId = roomId.ToString();
            request.ParticipantId = participantId.ToString();

            var linkedParticipantInConsultation = vmr?.Participants.Where(x => x != participantId)
                .Select(x => TestConference.Participants.FirstOrDefault(y => x == y.Id))
                .FirstOrDefault(z => z?.ParticipantStatus == ParticipantStatus.InConsultation);

            var videoApiParticipantResponse = TestConference.Participants.Select(x => new ParticipantSummaryResponse()
            {
                CaseGroup = x.CaseTypeGroup,
                ContactEmail = x.ContactEmail,
                ContactTelephone = x.ContactTelephone,
                CurrentInterpreterRoom = new RoomResponse()
                {
                    Id = vmr.Id,
                    Label = vmr.RoomLabel,
                    Locked = false
                },
                CurrentRoom = new RoomResponse()
                {
                    Id = consultationRoomId,
                    Label = consultationRoomLabel,
                    Locked = false
                },
                DisplayName = x.DisplayName,
                FirstName = x.FirstName,
                LastName = x.LastName,
                HearingRole = x.HearingRole,
                Id = x.Id
            }).ToList();

            Mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetParticipantsByConferenceIdAsync(It.Is<Guid>(y => y == TestConference.Id)))
                .ReturnsAsync(videoApiParticipantResponse);
            
            // Act
            var result = await Sut.SendHearingEventAsync(request);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();

            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(y => y.EventType == EventHub.Enums.EventType.Joined)),
                Times.Once);
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(y => y.EventType == EventHub.Enums.EventType.Transfer && y.TransferFrom == "WaitingRoom" && y.TransferTo == consultationRoomLabel)),
                Times.Exactly(finalParticipantCount));
            
            Mocker.Mock<IVideoApiClient>().Verify(x => x.RaiseVideoEventAsync(It.Is<ConferenceEventRequest>(y => y.EventType == EventType.RoomParticipantJoined)),
                Times.Once);
            Mocker.Mock<IVideoApiClient>().Verify(x => x.RaiseVideoEventAsync(It.Is<ConferenceEventRequest>(y => y.EventType == EventType.RoomParticipantTransfer && y.TransferFrom == "WaitingRoom" && y.TransferTo == consultationRoomLabel)),
                Times.Exactly(finalParticipantCount));
        }

        [Test]
        public async Task should_not_call_multiple_callback_events_for_vho_call_events()
        {
            // arrange
            var room = TestConference.CivilianRooms.First(x => x.Participants.Any());

            var request = CreateRequest();
            request.ParticipantId = room.Id.ToString();
            request.ParticipantRoomId = string.Empty;
            request.EventType = EventType.VhoCall;
            request.TransferFrom = "WaitingRoom";
            request.TransferTo = "ParticipantConsultationRoom7";
            
            // Act
            var result = await Sut.SendHearingEventAsync(request);
           
            // Assert
            Mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            result.Should().BeOfType<NoContentResult>();
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
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
            request.TransferTo = "ParticipantConsultationRoom7";

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
