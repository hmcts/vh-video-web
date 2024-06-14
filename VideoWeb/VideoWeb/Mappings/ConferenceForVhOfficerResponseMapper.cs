using System;
using System.Collections.Generic;
using BookingsApi.Contract.V1.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Mappings
{
    public class ConferenceForVhOfficerResponseMapper(
        IMapTo<IEnumerable<ParticipantResponse>, List<ParticipantForUserResponse>> participantForUserResponseMapper) : IMapTo<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>
    {
        public const string NotRequired = "Not Required";
        public const string NotAllocated = "Not Allocated";
        
        public ConferenceForVhOfficerResponse Map(ConferenceForAdminResponse conference, AllocatedCsoResponse allocatedCsoResponse)
        {
            string allocatedCso;
            
            if(!allocatedCsoResponse?.SupportsWorkAllocation ?? false)
                allocatedCso = NotRequired;
            else
                allocatedCso = allocatedCsoResponse?.Cso?.FullName ?? NotAllocated;
            
            
            var response = new ConferenceForVhOfficerResponse
            {
                Id = conference.Id,
                CaseName = conference.CaseName,
                CaseNumber = conference.CaseNumber,
                CaseType = conference.CaseType,
                ScheduledDateTime = conference.ScheduledDateTime,
                ScheduledDuration = conference.ScheduledDuration,
                Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
                HearingVenueName = conference.HearingVenueName,
                Participants = participantForUserResponseMapper.Map(conference.Participants),
                StartedDateTime = conference.StartedDateTime,
                ClosedDateTime = conference.ClosedDateTime,
                TelephoneConferenceId = conference.TelephoneConferenceId,
                TelephoneConferenceNumbers = conference.TelephoneConferenceNumbers,
                CreatedDateTime = conference.CreatedDateTime,
                HearingRefId = conference.HearingRefId,
                AllocatedCso = allocatedCso,
                AllocatedCsoId = allocatedCsoResponse?.Cso?.Id
            };
            return response;
        }
    }
}
