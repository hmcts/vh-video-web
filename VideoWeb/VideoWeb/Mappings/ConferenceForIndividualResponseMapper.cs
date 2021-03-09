using System;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using Conference = VideoApi.Contract.Responses.ConferenceForIndividualResponse;
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
                CaseName = conference.CaseName,
                CaseNumber = conference.CaseNumber,
                ScheduledDateTime = conference.ScheduledDateTime,
                Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
                ClosedDateTime = conference.ClosedDateTime
            };
        }
    }
}
