using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V1.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Mappings
{
    public class ConferenceForVhOfficerResponseMapper(IMapTo<IEnumerable<ParticipantResponse>, List<ParticipantForUserResponse>> participantMapper) 
        : IMapTo<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>
    {
        public const string NotRequired = "Not Required";
        public const string NotAllocated = "Not Allocated";
        
        public ConferenceForVhOfficerResponse Map(ConferenceForAdminResponse conference, AllocatedCsoResponse allocatedCsoResponse)
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
            response.Participants = participantMapper.Map(conference.Participants).ToList();
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
}
