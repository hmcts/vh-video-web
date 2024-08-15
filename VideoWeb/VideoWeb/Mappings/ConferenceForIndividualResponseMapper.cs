using System;
using VideoWeb.Common.Models;
using Conference = VideoApi.Contract.Responses.ConferenceForIndividualResponse;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;

namespace VideoWeb.Mappings;

public static class ConferenceForIndividualResponseMapper
{
    public static ConferenceForIndividualResponse Map(Conference conference)
    {
        return new ConferenceForIndividualResponse
        {
            Id = conference.Id,
            CaseName = conference.CaseName,
            CaseNumber = conference.CaseNumber,
            ScheduledDateTime = conference.ScheduledDateTime,
            Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
            ClosedDateTime = conference.ClosedDateTime,
            HearingVenueIsScottish = conference.HearingVenueIsScottish
        };
    }
}
