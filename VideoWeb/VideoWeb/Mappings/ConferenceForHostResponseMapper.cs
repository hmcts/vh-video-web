using System;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;

namespace VideoWeb.Mappings;

public static class ConferenceForHostResponseMapper
{
    public static ConferenceForHostResponse Map(HearingDetailsResponseV2 bookingDetails, ConferenceDetailsResponse conference)
    {
        var caseInformation = bookingDetails.Cases.FirstOrDefault(c => c.IsLeadCase) ?? bookingDetails.Cases[0];
        return new ConferenceForHostResponse
        {
            Id = conference.Id,
            Status = Enum.Parse<ConferenceStatus>(conference.CurrentStatus.ToString()),
            CaseName = caseInformation.Name,
            CaseNumber = caseInformation.Number,
            CaseType = bookingDetails.ServiceName,
            ScheduledDuration = conference.ScheduledDuration,
            ClosedDateTime = conference.ClosedDateTime,
            ScheduledDateTime = conference.ScheduledDateTime,
            Participants = conference.Participants.Select(ParticipantForHostResponseMapper.Map).ToList(),
            NumberOfEndpoints = bookingDetails.Endpoints.Count,
            HearingVenueIsScottish = bookingDetails.IsHearingVenueScottish,
        };
    }
}
