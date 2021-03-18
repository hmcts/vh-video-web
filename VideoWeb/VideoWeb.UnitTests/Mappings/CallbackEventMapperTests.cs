
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Mappings
{
    public class CallbackEventMapperTests : BaseMockerSutTestSetup<CallbackEventMapper>
    {
        [Test]
        public void Should_map_conference_event_to_callback_event()
        {
            var testConference = new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                }
            };
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = testConference.Id.ToString())
                .With(x => x.ParticipantId = testConference.Participants[0].Id.ToString())
                .With(x => x.EventType = EventType.Joined)
                .Build();

            var result = _sut.Map(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.TransferFrom.Should().Be(conferenceEventRequest.TransferFrom);
            result.TransferTo.Should().Be(conferenceEventRequest.TransferTo);
        }

        [Test]
        public void should_map_callback_to_endpoint_joined()
        {
            var testConference = CreateTestConferenceForEndpointEvent();
            
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = testConference.Id.ToString())
                .With(x => x.ParticipantId = testConference.Endpoints[0].Id.ToString())
                .With(x => x.EventType = EventType.Joined)
                .Build();

            var result =
                _sut.Map(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.EventType.Should().Be(EventHub.Enums.EventType.EndpointJoined);
        }

        [Test]
        public void should_map_callback_to_endpoint_disconnected()
        {
            var testConference = CreateTestConferenceForEndpointEvent();
            
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = testConference.Id.ToString())
                .With(x => x.ParticipantId = testConference.Endpoints[0].Id.ToString())
                .With(x => x.EventType = EventType.Disconnected)
                .Build();

            var result = _sut.Map(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.EventType.Should().Be(EventHub.Enums.EventType.EndpointDisconnected);
        }
        
        [Test]
        public void should_map_callback_to_endpoint_transferred()
        {
            var testConference = CreateTestConferenceForEndpointEvent();
            
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = testConference.Id.ToString())
                .With(x => x.ParticipantId = testConference.Endpoints[0].Id.ToString())
                .With(x => x.EventType = EventType.Transfer)
                .Build();

            var result = _sut.Map(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.EventType.Should().Be(EventHub.Enums.EventType.EndpointTransfer);
        }

        [Test]
        public void should_map_room_participant_joined_to_joined()
        {
            var testConference = CreateTestConferenceForRoomParticipantEvent();
            var room = testConference.CivilianRooms.First();
            var participantId = room.Participants.First();
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = testConference.Id.ToString())
                .With(x => x.ParticipantId = participantId.ToString())
                .With(x => x.ParticipantRoomId = room.Id.ToString())
                .With(x => x.EventType = EventType.RoomParticipantJoined)
                .Build();
            
            var result = _sut.Map(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.EventType.Should().Be(EventHub.Enums.EventType.Joined);
        }
        
        [Test]
        public void should_map_room_participant_disconnected_to_disconnected()
        {
            var testConference = CreateTestConferenceForRoomParticipantEvent();
            var room = testConference.CivilianRooms.First();
            var participantId = room.Participants.First();
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = testConference.Id.ToString())
                .With(x => x.ParticipantId = participantId.ToString())
                .With(x => x.ParticipantRoomId = room.Id.ToString())
                .With(x => x.EventType = EventType.RoomParticipantDisconnected)
                .Build();
            
            var result = _sut.Map(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.EventType.Should().Be(EventHub.Enums.EventType.Disconnected);
        }
        
        [Test]
        public void should_map_room_participant_transfer_to_transfer()
        {
            var testConference = CreateTestConferenceForRoomParticipantEvent();
            var room = testConference.CivilianRooms.First();
            var participantId = room.Participants.First();
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = testConference.Id.ToString())
                .With(x => x.ParticipantId = participantId.ToString())
                .With(x => x.ParticipantRoomId = room.Id.ToString())
                .With(x => x.EventType = EventType.Transfer)
                .Build();
            
            var result = _sut.Map(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.EventType.Should().Be(EventHub.Enums.EventType.Transfer);
        }
        
        private static Conference CreateTestConferenceForEndpointEvent()
        {
            var testConference = new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .Build()
                },
                Endpoints = Builder<Endpoint>.CreateListOfSize(2).Build().ToList()
            };
            return testConference;
        }
        
        private Conference CreateTestConferenceForRoomParticipantEvent()
        {
            var conference = new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                },
                HearingVenueName = "Hearing Venue Test",
                CivilianRooms = new List<CivilianRoom>
                {
                    new CivilianRoom {Id = 1, RoomLabel = "Interpreter1", Participants = new List<Guid>()}
                }
            };

            conference.CivilianRooms.First().Participants.Add(conference.Participants[1].Id);
            conference.CivilianRooms.First().Participants.Add(conference.Participants[2].Id);

            return conference;
        }
    }
}
