using System;
using System.Collections.Generic;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings;

public static class BookingForIndividualResponseMapper 
{
    public static ConferenceForIndividualResponse Map(ConfirmedHearingsTodayResponseV2 booking, List<ConferenceCoreResponse> conferences)
    {
        var conference = conferences.Find(x => x.HearingId == booking.Id);
        if (conference == null)
        {
            return null;
        }
        return new ConferenceForIndividualResponse
        {
            Id = conference.Id,
            CaseName = booking.CaseName,
            CaseNumber = booking.CaseNumber,
            ScheduledDateTime = booking.ScheduledDateTime,
            Status = Enum.Parse<ConferenceStatus>(conference.CurrentStatus.ToString()),
            ClosedDateTime = conference.ClosedDateTime,
            HearingVenueIsScottish = booking.IsHearingVenueScottish,
            IsWaitingRoomOpen = conference.IsWaitingRoomOpen
        };
    }
}
