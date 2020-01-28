using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using FluentAssertions;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;

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
            _conference.Case_name.Should().Be(hearingCase.Name);
            _conference.Case_number.Should().Be(hearingCase.Number);
            _conference.Case_type.Should().Be(hearing.Case_type_name);
            _conference.Current_status.Should().Be(ConferenceState.NotStarted);
            _conference.Hearing_id.Should().Be(hearing.Id);
            _conference.Scheduled_date_time.Should().Be(hearing.Scheduled_date_time);
            _conference.Scheduled_duration.Should().Be(hearing.Scheduled_duration);
            ParticipantsMatch(hearing.Participants);
        }

        private void ParticipantsMatch(IReadOnlyCollection<ParticipantResponse> hearingParticipants)
        {
            var conferenceParticipants = _conference.Participants;

            foreach (var conferenceParticipant in conferenceParticipants)
            {
                if (conferenceParticipant.Ref_id == Guid.Empty)
                {
                    throw new DataException("Participant Ref Id cannot be null");                  
                }

                var participantFound = false;
                foreach (var hearingParticipant in hearingParticipants)
                {
                    if (!conferenceParticipant.Ref_id.Equals(hearingParticipant.Id)) continue;
                    conferenceParticipant.Case_type_group.Should().Be(hearingParticipant.Case_role_name);
                    conferenceParticipant.Display_name.Should().Be(hearingParticipant.Display_name);
                    conferenceParticipant.Name.Should().Be(
                            $"{hearingParticipant.Title} {hearingParticipant.First_name} {hearingParticipant.Last_name}");
                    conferenceParticipant.Username.ToLower().Should().Be(hearingParticipant.Username.ToLower());
                    if (conferenceParticipant.User_role == UserRole.Representative)
                        conferenceParticipant.Representee.Should().Be(hearingParticipant.Representee);
                    participantFound = true;
                    break;
                }
                participantFound.Should().BeTrue("Participant found in the list of hearing participants");
            }
        }
    }
}
