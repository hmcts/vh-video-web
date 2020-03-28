using Conference = VideoWeb.Services.Video.ConferenceForIndividualResponse;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;

namespace VideoWeb.Mappings
{
    public static class ConferenceForIndividualResponseMapper
    {
        public static ConferenceForIndividualResponse MapConferenceSummaryToModel(Conference conference)
        {
            return new ConferenceForIndividualResponse
            {
                Id = conference.Id,
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                ScheduledDateTime = conference.Scheduled_date_time,
            };
        }
    }
}
