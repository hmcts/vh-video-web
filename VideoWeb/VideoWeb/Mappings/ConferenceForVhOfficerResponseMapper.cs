using System;
using System.Linq;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Enums;

namespace VideoWeb.Mappings;

public static class ConferenceForVhOfficerResponseMapper
{
    public const string NotRequired = "Not Required";
    public const string NotAllocated = "Not Allocated";
    
    public static ConferenceForVhOfficerResponse Map(Conference conference, AllocatedCsoResponse allocatedCsoResponse)
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
        response.Status = Enum.Parse<ConferenceStatus>(conference.CurrentStatus.ToString());
        response.HearingVenueName = conference.HearingVenueName;
        response.Participants = conference.Participants.Select(ParticipantUserResponseMapper.Map).ToList();
        response.StartedDateTime = conference.ScheduledDateTime;
        response.ClosedDateTime = conference.ClosedDateTime;
        response.TelephoneConferenceId = conference.TelephoneConferenceId;
        response.TelephoneConferenceNumbers = conference.TelephoneConferenceNumbers;
        response.CreatedDateTime = conference.CreatedDateTime;
        response.HearingRefId = conference.HearingId;
        response.AllocatedCso = allocatedCso;
        response.AllocatedCsoId = allocatedCsoResponse?.Cso?.Id;
        response.Supplier = (Supplier)conference.Supplier;
        return response;
    }
    
    public static ConferenceForVhOfficerResponse Map(ConferenceDetailsResponse conference, AllocatedCsoResponse allocatedCsoResponse, HearingDetailsResponseV2 hearingDetails)
    {
        var allocatedCso = !allocatedCsoResponse?.SupportsWorkAllocation ?? false
            ? NotRequired
            : allocatedCsoResponse?.Cso?.FullName ?? NotAllocated;
        
        var caseInfo = hearingDetails.Cases.FirstOrDefault(c => c.IsLeadCase) ?? hearingDetails.Cases[0];
        
        var response = new ConferenceForVhOfficerResponse();
        response.Id = conference.Id;
        response.CaseName = caseInfo.Name;
        response.CaseNumber = caseInfo.Number;
        response.CaseType = hearingDetails.ServiceName;
        response.ScheduledDateTime = conference.ScheduledDateTime;
        response.ScheduledDuration = conference.ScheduledDuration;
        response.Status = Enum.Parse<ConferenceStatus>(conference.CurrentStatus.ToString());
        response.HearingVenueName = hearingDetails.HearingVenueName;
        response.Participants = conference.Participants.Select(ParticipantUserResponseMapper.Map).ToList();
        response.StartedDateTime = conference.StartedDateTime;
        response.ClosedDateTime = conference.ClosedDateTime;
        response.TelephoneConferenceId = conference.TelephoneConferenceId;
        response.TelephoneConferenceNumbers = conference.TelephoneConferenceNumbers;
        response.CreatedDateTime = hearingDetails.CreatedDate;
        response.HearingRefId = conference.HearingId;
        response.AllocatedCso = allocatedCso;
        response.AllocatedCsoId = allocatedCsoResponse?.Cso?.Id;
        response.Supplier = (Supplier)conference.Supplier;
        return response;
    }
}
