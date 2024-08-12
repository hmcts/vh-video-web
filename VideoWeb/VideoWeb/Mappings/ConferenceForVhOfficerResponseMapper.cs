using System;
using System.Linq;
using BookingsApi.Contract.V1.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings;

public static class ConferenceForVhOfficerResponseMapper
{
    public const string NotRequired = "Not Required";
    public const string NotAllocated = "Not Allocated";
    
    public static ConferenceForVhOfficerResponse Map(ConferenceForAdminResponse conference, AllocatedCsoResponse allocatedCsoResponse)
    {
        var allocatedCso = !allocatedCsoResponse?.SupportsWorkAllocation ?? false
            ? NotRequired
            : allocatedCsoResponse?.Cso?.FullName ?? NotAllocated;
        
        var response = new ConferenceForVhOfficerResponse();
        response.Id = conference.Id;
        response.CaseName = conference.CaseName;
        response.CaseNumber = conference.CaseNumber;
        response.CaseType = conference.CaseType;
        response.ScheduledDateTime = conference.ScheduledDateTime;
        response.ScheduledDuration = conference.ScheduledDuration;
        response.Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString());
        response.HearingVenueName = conference.HearingVenueName;
        response.Participants = conference.Participants.Select(ParticipantUserResponseMapper.Map).ToList();
        response.StartedDateTime = conference.StartedDateTime;
        response.ClosedDateTime = conference.ClosedDateTime;
        response.TelephoneConferenceId = conference.TelephoneConferenceId;
        response.TelephoneConferenceNumbers = conference.TelephoneConferenceNumbers;
        response.CreatedDateTime = conference.CreatedDateTime;
        response.HearingRefId = conference.HearingRefId;
        response.AllocatedCso = allocatedCso;
        response.AllocatedCsoId = allocatedCsoResponse?.Cso?.Id;
        return response;
    }
}
