using System;
using System.Collections.Generic;
using BookingsApi.Contract.V1.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApiConferenceForIndividualResponse = VideoApi.Contract.Responses.ConferenceForIndividualResponse;
namespace VideoWeb.Mappings;

public class BookingForIndividualResponseMapper : IMapTo<ConfirmedHearingsTodayResponse, List<VideoApiConferenceForIndividualResponse>, ConferenceForIndividualResponse>
{
    public ConferenceForIndividualResponse Map(ConfirmedHearingsTodayResponse booking, List<VideoApiConferenceForIndividualResponse> conferences)
    {
        var conference = conferences.Find(x => x.HearingId == booking.Id);
        return new ConferenceForIndividualResponse
        {
            Id = conference.Id,
            CaseName = booking.CaseName,
            CaseNumber = booking.CaseNumber,
            ScheduledDateTime = booking.ScheduledDateTime,
            Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
            ClosedDateTime = conference.ClosedDateTime,
            HearingVenueIsScottish = booking.IsHearingVenueScottish,
            IsWaitingRoomOpen = conference.IsWaitingRoomOpen
        };
    }
}
