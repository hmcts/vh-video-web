using System;
using VideoWeb.Common.Models;
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
            Status = Enum.Parse<ConferenceStatus>(conference.CurrentStatus.ToString()),
            ClosedDateTime = conference.ClosedDateTime,
            HearingVenueIsScottish = conference.IsScottish
        };
    }
}
