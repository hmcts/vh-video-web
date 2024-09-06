using Moq;
using NUnit.Framework;
using FluentAssertions;
using System;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.EventHandlers
{
    class ParticipantAddedEventHandlerTests : EventHandlerTestBase
    {
        private ParticipantsUpdatedEventHandler _eventHandler;

        [Test]
        public async Task Should_send_participants_updated_message_to_participants()
        {
            _eventHandler = new ParticipantsUpdatedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;

            var participantCount = conference.Participants.Count;
            var participants = conference.Participants
                .Select(p => new ParticipantResponse
                {
                    UserName = p.Username
                })
                .ToList();

            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.ParticipantsUpdated,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                Participants = participants,
                ParticipantsToNotify = participants,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            const int vhoCount = 1;
            const int staffMemberCount = 1;
            EventHubClientMock.Verify(
                x => x.ParticipantsUpdatedMessage(conference.Id, participants), Times.Exactly(participantCount + vhoCount + staffMemberCount));
            TestConference.Participants.Should().HaveCount(participantCount);
        }
        
        [Test]
        public async Task should_only_publish_one_message_to_staff_member_participants()
        {
            _eventHandler = new ParticipantsUpdatedEventHandler(EventHubContextMock.Object, ConferenceServiceMock.Object, LoggerMock.Object);

            var conference = TestConference;
            AddParticipantToConference(Role.StaffMember);
            var participants = conference.Participants
                .Select(p => new ParticipantResponse
                {
                    UserName = p.Username,
                    Role = p.Role
                })
                .ToList();
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.ParticipantsUpdated,
                EventId = Guid.NewGuid().ToString(),
                ConferenceId = conference.Id,
                Participants = participants,
                ParticipantsToNotify = participants,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);
            
            const int vhoCount = 1;
            const int nonParticipantStaffMemberCount = 1; // Non-participant staff member = a staff member who is not a participant on the conference
            var nonStaffMemberParticipantCount = conference.Participants.Count(p => p.Role != Role.StaffMember); // Non-staff member participants = participants minus staff members
            var expectedMessageCount = nonParticipantStaffMemberCount + vhoCount + nonStaffMemberParticipantCount;
            EventHubClientMock.Verify(x => x.ParticipantsUpdatedMessage(callbackEvent.ConferenceId, participants), Times.Exactly(expectedMessageCount));
        }
    }
}
