using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class ConferenceForVhOfficerResponseMapper
    {
        public static ConferenceForVhOfficerResponse MapConferenceSummaryToResponseModel(
            ConferenceForAdminResponse conference)
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
                Participants = ParticipantForUserResponseMapper.MapParticipants(conference.Participants),
                StartedDateTime = conference.Started_date_time
            };
            return response;
        }
    }
}
