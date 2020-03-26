using System;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class ConferenceForIndividualResponseMapper
    {
        public static ConferenceForIndividualResponse MapConferenceSummaryToModel(ConferenceSummaryResponse conference, string loggedInUsername)
        {
            var participant = conference.Participants.Single(p =>
                p.Username.Equals(loggedInUsername, StringComparison.OrdinalIgnoreCase));
            return new ConferenceForIndividualResponse
            {
                Id = conference.Id,
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                ScheduledDateTime = conference.Scheduled_date_time,
                LoggedInParticipantId = participant.Id,
                LoggedInParticipantDisplayName = participant.Display_name
            };
        }
    }
}
