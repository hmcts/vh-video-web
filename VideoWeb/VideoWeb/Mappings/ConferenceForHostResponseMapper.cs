using System;
using System.Linq;
using VideoWeb.Common.Models;
using Conference = VideoApi.Contract.Responses.ConferenceForHostResponse;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;

namespace VideoWeb.Mappings;

public static class ConferenceForHostResponseMapper
{
    public static ConferenceForHostResponse Map(Conference conference)
    {
        return new ConferenceForHostResponse
        {
            Id = conference.Id,
            Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
            CaseName = conference.CaseName,
            CaseNumber = conference.CaseNumber,
            CaseType = conference.CaseType,
            ScheduledDuration = conference.ScheduledDuration,
            ClosedDateTime = conference.ClosedDateTime,
            ScheduledDateTime = conference.ScheduledDateTime,
            Participants = conference.Participants.Select(ParticipantForHostResponseMapper.Map).ToList(),
            NumberOfEndpoints = conference.NumberOfEndpoints,
            HearingVenueIsScottish = conference.HearingVenueIsScottish
        };
    }
}
