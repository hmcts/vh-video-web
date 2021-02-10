using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ConferenceForVhOfficerResponseMapper : IMapTo<ConferenceForAdminResponse, ConferenceForVhOfficerResponse>
    {
        private readonly IMapTo<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>> _participantForUserResponseMapper;

        public ConferenceForVhOfficerResponseMapper(IMapTo<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>> participantForUserResponseMapper)
        {
            _participantForUserResponseMapper = participantForUserResponseMapper;
        }

        public ConferenceForVhOfficerResponse Map(ConferenceForAdminResponse conference)
        {
            var response = new ConferenceForVhOfficerResponse
            {
                Id = conference.Id,
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                CaseType = conference.Case_type,
                ScheduledDateTime = conference.Scheduled_date_time,
                ScheduledDuration = conference.Scheduled_duration,
                Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
                HearingVenueName = conference.Hearing_venue_name,
                Participants = _participantForUserResponseMapper.Map(conference.Participants),
                StartedDateTime = conference.Started_date_time,
                ClosedDateTime = conference.Closed_date_time,
                TelephoneConferenceId = conference.Telephone_conference_id,
                TelephoneConferenceNumber = conference.Telephone_conference_number,
                CreatedDateTime = conference.Created_date_time
            };
            return response;
        }
    }
}
