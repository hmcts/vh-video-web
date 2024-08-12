using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V1.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Mappings;

public static class BookingForHostResponseMapper
{
    public static Contract.Responses.ConferenceForHostResponse Map(ConfirmedHearingsTodayResponse booking, List<ConferenceForHostResponse> conferences)
    {
        var conference = conferences.Find(x => x.HearingId == booking.Id);
        var dto = new Contract.Responses.ConferenceForHostResponse();
        dto.Id = conference.Id;
        dto.CaseName = booking.CaseName;
        dto.CaseNumber = booking.CaseNumber;
        dto.CaseType = booking.CaseTypeName;
        dto.ScheduledDuration = booking.ScheduledDuration;
        dto.ScheduledDateTime = booking.ScheduledDateTime;
        dto.NumberOfEndpoints = booking.Endpoints.Count;
        dto.HearingVenueIsScottish = booking.IsHearingVenueScottish;
        dto.Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString());
        dto.ClosedDateTime = conference.ClosedDateTime;
        dto.Participants = conference.Participants
            .Select(ParticipantForHostResponseMapper.Map)
            .ToList(); // need to use participant list from video api to include QL users
        return dto;
    }
}
