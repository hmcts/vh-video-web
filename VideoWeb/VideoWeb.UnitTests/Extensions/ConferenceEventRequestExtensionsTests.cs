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
        private Conference _testConference;
        private static long _participantRoomId;
        
        [SetUp]
        public void Setup()
        {
            _testConference = BuildConferenceForTest();
            _participantRoomId = 1234;
        }

        [TestCase(EventType.Joined, EventType.RoomParticipantJoined)]
        [TestCase(EventType.Disconnected, EventType.RoomParticipantDisconnected)]
        public void should_map_event_to_participant_room_event(EventType originalEventType, EventType expectedEventType)
        {
            var civilianRoom = _testConference.CivilianRooms.First();
            var participantId = _testConference.Participants.Last().Id;
            var request = CreateRequest();
            request.EventType = originalEventType;
            request.ParticipantRoomId = civilianRoom.Id.ToString();
            request.ParticipantId = participantId.ToString();

            var result = request.CreateEventsForParticipantsInRoom(_testConference, civilianRoom.Id);
            result.All(r => r.EventType == expectedEventType).Should().BeTrue();
        }

        [Test]
        public void should_map_transfer_event_to_participant_room_transfer_event()
        {
            var civilianRoom = _testConference.CivilianRooms.First();
            var request = CreateRequest();
            request.EventType = EventType.Transfer;
            request.ParticipantId = civilianRoom.Id.ToString();

            var result = request.CreateEventsForParticipantsInRoom(_testConference, civilianRoom.Id);
            result.All(r => r.EventType == EventType.RoomParticipantTransfer).Should().BeTrue();
        }
        
        [Test]
        public void SetRoleForParticipantEvent_SetsGuestRole_WhenIndividualParticipantIsNonScreened()
        {
            _testConference.Participants.ForEach(p => p.ProtectFrom = new List<string>());
            var participant = _testConference.Participants.Find(x => x.Role == Role.Individual);
            var request = new ConferenceEventRequest { ParticipantId = participant.Id.ToString() };

            request.SetRoleForParticipantEvent(_testConference);

            request.ConferenceRole.Should().Be(ConferenceRole.Guest);
        }
        
        [Test]
        public void SetRoleForParticipantEvent_SetsHostRole_WhenHostParticipantIsNonScreened()
        {
            _testConference.Participants.ForEach(p => p.ProtectFrom = new List<string>());
            var participant = _testConference.Participants.Find(x => x.Role == Role.Judge);
            var request = new ConferenceEventRequest { ParticipantId = participant.Id.ToString() };

            request.SetRoleForParticipantEvent(_testConference);

            request.ConferenceRole.Should().Be(ConferenceRole.Host);
        }

        [Test]
        public void SetRoleForParticipantEvent_SetsGuestRole_WhenHostParticipantIsScreened()
        {
            _testConference.Participants.ForEach(p => p.ProtectFrom = new List<string>());
            var participant = _testConference.Participants.Find(x => x.Role == Role.Individual);
            participant.ProtectFrom.Add(_testConference.Endpoints[0].ExternalReferenceId);
            var request = new ConferenceEventRequest { ParticipantId = participant.Id.ToString() };

            request.SetRoleForParticipantEvent(_testConference);

            request.ConferenceRole.Should().Be(ConferenceRole.Guest);
        }

        [Test]
        public void SetRoleForParticipantEvent_DoNothing_WhenHostParticipantIsNotProvided()
        {
            var request = new ConferenceEventRequest { ParticipantId = null };
            Assert.Throws<ArgumentNullException>(() => request.SetRoleForParticipantEvent(null));
        }

        [Test]
        public void SetRoleForParticipantEvent_ThrowsArgumentNullException_WhenConferenceIsNull()
        {
            var request = new ConferenceEventRequest { ParticipantId = Guid.NewGuid().ToString() };

            Assert.Throws<ArgumentNullException>(() => request.SetRoleForParticipantEvent(null));
        }

        private Conference BuildConferenceForTest()
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
                Endpoints = new List<Endpoint>
                {
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1")
                        .Build(),
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2")
                        .Build()
                },
                HearingVenueName = "Hearing Venue Test",
                CivilianRooms = new List<CivilianRoom>
                {
                    new CivilianRoom {Id = _participantRoomId, RoomLabel = "Interpreter1", Participants = new List<Guid>()}
                },
                CurrentStatus = ConferenceStatus.InSession,
            };


            conference.CivilianRooms.First().Participants.Add(conference.Participants[1].Id);
            conference.CivilianRooms.First().Participants.Add(conference.Participants[2].Id);

            return conference;
        }
        
        protected ConferenceEventRequest CreateRequest(string phone = null)
        {
            return Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = _testConference.Id.ToString())
                .With(x => x.ParticipantId = _testConference.Participants[0].Id.ToString())
                .With(x => x.EventType = EventType.Joined)
                .With(x => x.Phone = phone)
                .Build();
        }
    }
}
