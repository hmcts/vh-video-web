using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Extensions;

namespace VideoWeb.UnitTests.Extensions
{
    public class ConferenceEventRequestExtensionsTests
    {
        private ConferenceDto _testConferenceDto;
        private static long _participantRoomId;
        
        [SetUp]
        public void Setup()
        {
            _testConferenceDto = BuildConferenceForTest();
            _participantRoomId = 1234;
        }

        [TestCase(EventType.Joined, EventType.RoomParticipantJoined)]
        [TestCase(EventType.Disconnected, EventType.RoomParticipantDisconnected)]
        public void should_map_event_to_participant_room_event(EventType originalEventType, EventType expectedEventType)
        {
            var civilianRoom = _testConferenceDto.CivilianRooms.First();
            var participantId = _testConferenceDto.Participants.Last().Id;
            var request = CreateRequest();
            request.EventType = originalEventType;
            request.ParticipantRoomId = civilianRoom.Id.ToString();
            request.ParticipantId = participantId.ToString();

            var result = request.CreateEventsForParticipantsInRoom(_testConferenceDto, civilianRoom.Id);
            result.All(r => r.EventType == expectedEventType).Should().BeTrue();
        }

        [Test]
        public void should_map_transfer_event_to_participant_room_transfer_event()
        {
            var civilianRoom = _testConferenceDto.CivilianRooms.First();
            var request = CreateRequest();
            request.EventType = EventType.Transfer;
            request.ParticipantId = civilianRoom.Id.ToString();

            var result = request.CreateEventsForParticipantsInRoom(_testConferenceDto, civilianRoom.Id);
            result.All(r => r.EventType == EventType.RoomParticipantTransfer).Should().BeTrue();
        }

        protected ConferenceDto BuildConferenceForTest()
        {
            var conference = new ConferenceDto
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<ParticipantDto>()
                {
                    Builder<ParticipantDto>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                },
                Endpoints = new List<EndpointDto>
                {
                    Builder<EndpointDto>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1")
                        .Build(),
                    Builder<EndpointDto>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2")
                        .Build()
                },
                HearingVenueName = "Hearing Venue Test",
                CivilianRooms = new List<CivilianRoomDto>
                {
                    new CivilianRoomDto {Id = _participantRoomId, RoomLabel = "Interpreter1", Participants = new List<Guid>()}
                },
                CurrentStatus = ConferenceState.InSession,
            };


            conference.CivilianRooms.First().Participants.Add(conference.Participants[1].Id);
            conference.CivilianRooms.First().Participants.Add(conference.Participants[2].Id);

            return conference;
        }
        
        protected ConferenceEventRequest CreateRequest(string phone = null)
        {
            return Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = _testConferenceDto.Id.ToString())
                .With(x => x.ParticipantId = _testConferenceDto.Participants[0].Id.ToString())
                .With(x => x.EventType = EventType.Joined)
                .With(x => x.Phone = phone)
                .Build();
        }
    }
}
