using System;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Mappings;

public static class BookingForHostResponseMapper
{
    public static Contract.Responses.ConferenceForHostResponse Map(ConfirmedHearingsTodayResponseV2 booking, ConferenceCoreResponse conference)
    {
        var dto = new Contract.Responses.ConferenceForHostResponse();
        dto.Id = conference.Id;
        dto.CaseName = booking.CaseName;
        dto.CaseNumber = booking.CaseNumber;
        dto.CaseType = booking.ServiceName;
        dto.ScheduledDuration = booking.ScheduledDuration;
        dto.ScheduledDateTime = booking.ScheduledDateTime;
        dto.NumberOfEndpoints = booking.Endpoints?.Count ?? 0;
        dto.HearingVenueIsScottish = booking.IsHearingVenueScottish;
        dto.Status = Enum.Parse<ConferenceStatus>(conference.CurrentStatus.ToString());
        dto.ClosedDateTime = conference.ClosedDateTime;
        dto.Participants = conference.Participants
            .Select(ParticipantForHostResponseMapper.Map)
            .ToList(); 
        return dto;
    }
    
    public static Contract.Responses.ConferenceForHostResponse Map(HearingDetailsResponseV2 booking, ConferenceCoreResponse conference)
    {
        var caseInfo = booking.Cases.FirstOrDefault(c => c.IsLeadCase) ?? booking.Cases[0];
        
        var dto = new Contract.Responses.ConferenceForHostResponse();
        dto.Id = conference.Id;
        dto.CaseName = caseInfo.Name;
        dto.CaseNumber = caseInfo.Number;
        dto.CaseType = booking.ServiceName;
        dto.ScheduledDuration = booking.ScheduledDuration;
        dto.ScheduledDateTime = booking.ScheduledDateTime;
        dto.NumberOfEndpoints = booking.Endpoints?.Count ?? 0;
        dto.HearingVenueIsScottish = booking.IsHearingVenueScottish;
        dto.Status = Enum.Parse<ConferenceStatus>(conference.CurrentStatus.ToString());
        dto.ClosedDateTime = conference.ClosedDateTime;
        dto.Participants = conference.Participants
            .Select(ParticipantForHostResponseMapper.Map)
            .ToList(); // need to use participant list from video api to include QL users
        return dto;
    }
}
