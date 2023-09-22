using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V1.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings;

public class BookingForHostResponseMapper : IMapTo<ConfirmedHearingsTodayResponse, List<ConferenceForHostResponse>, VideoWeb.Contract.Responses.ConferenceForHostResponse>
{
    private readonly IMapTo<ParticipantForHostResponse, VideoWeb.Contract.Responses.ParticipantForHostResponse> _participantForHostResponseMapper;
 
    public BookingForHostResponseMapper(IMapTo<ParticipantForHostResponse, VideoWeb.Contract.Responses.ParticipantForHostResponse> participantForHostResponseMapper)
    {
        _participantForHostResponseMapper = participantForHostResponseMapper;
    }
 
    public Contract.Responses.ConferenceForHostResponse Map(ConfirmedHearingsTodayResponse booking, List<ConferenceForHostResponse> conferences)
    {
        var conference = conferences.Find(x => x.HearingId == booking.Id);
        var dto = new Contract.Responses.ConferenceForHostResponse
        {
            Id = conference.Id,

            CaseName = booking.CaseName,
            CaseNumber = booking.CaseNumber,
            CaseType = booking.CaseTypeName,
            ScheduledDuration = booking.ScheduledDuration,
            ScheduledDateTime = booking.ScheduledDateTime,
            NumberOfEndpoints = booking.Endpoints.Count,
            HearingVenueIsScottish = booking.IsHearingVenueScottish,
            Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
            ClosedDateTime = conference.ClosedDateTime,
            Participants =
                conference.Participants.Select(_participantForHostResponseMapper.Map)
                    .ToList() // need to use participant list from video api to include QL users
        };
        return dto;
    }
}
