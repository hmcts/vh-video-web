using System;
using VideoWeb.Common.Models;
using Conference = VideoWeb.Services.Video.ConferenceForIndividualResponse;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;

namespace VideoWeb.Mappings
{
    public class ConferenceForIndividualResponseMapper : IMapTo<Conference, ConferenceForIndividualResponse>
    {
        public ConferenceForIndividualResponse Map(Conference conference)
        {
            return new ConferenceForIndividualResponse
            {
                Id = conference.Id,
                CaseName = conference.Case_name,
                CaseNumber = conference.Case_number,
                ScheduledDateTime = conference.Scheduled_date_time,
                Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
                ClosedDateTime = conference.Closed_date_time
            };
        }
    }
}
