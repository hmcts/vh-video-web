using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using BookingsApi.Contract.Responses;
using FluentAssertions;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Assertions
{
    public class AssertConference
    {
        private readonly ConferenceDetailsResponse _conference;

        public AssertConference(ConferenceDetailsResponse conference)
        {
            _conference = conference;
        }

        public void MatchesHearing(HearingDetailsResponse hearing)
        {
            var hearingCase = hearing.Cases.First();
            _conference.CaseName.Should().Be(hearingCase.Name);
            _conference.CaseNumber.Should().Be(hearingCase.Number);
            _conference.CaseType.Should().Be(hearing.CaseTypeName);
            _conference.CurrentStatus.Should().Be(ConferenceState.NotStarted);
            _conference.HearingId.Should().Be(hearing.Id);
            _conference.ScheduledDateTime.Should().Be(hearing.ScheduledDateTime);
            _conference.ScheduledDuration.Should().Be(hearing.ScheduledDuration);
            ParticipantsMatch(hearing.Participants);
        }

        private void ParticipantsMatch(IReadOnlyCollection<ParticipantResponse> hearingParticipants)
        {
            var conferenceParticipants = _conference.Participants;

            foreach (var conferenceParticipant in conferenceParticipants)
            {
                if (conferenceParticipant.RefId == Guid.Empty)
                {
                    throw new DataException("Participant Ref Id cannot be null");                  
                }

                var participantFound = false;
                foreach (var hearingParticipant in hearingParticipants)
                {
                    if (!conferenceParticipant.RefId.Equals(hearingParticipant.Id)) continue;
                    conferenceParticipant.CaseTypeGroup.Should().Be(hearingParticipant.CaseRoleName);
                    conferenceParticipant.DisplayName.Should().Be(hearingParticipant.DisplayName);
                    conferenceParticipant.Name.Should().Be($"{hearingParticipant.Title} {hearingParticipant.FirstName} {hearingParticipant.LastName}");
                    conferenceParticipant.Username.ToLower().Should().Be(hearingParticipant.Username.ToLower());
                    if (conferenceParticipant.UserRole == UserRole.Representative)
                        conferenceParticipant.Representee.Should().Be(hearingParticipant.Representee);
                    participantFound = true;
                    break;
                }
                participantFound.Should().BeTrue("Participant found in the list of hearing participants");
            }
        }
    }
}
