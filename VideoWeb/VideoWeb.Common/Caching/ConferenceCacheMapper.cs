using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public static class ConferenceCacheMapper
    {
        public static Conference MapConferenceToCacheModel(ConferenceDetailsResponse conferenceResponse)
        {
            var participants = conferenceResponse
                .Participants
                .Select(participant => new Participant
                {
                    Id = participant.Id,
                    RefId = participant.RefId,
                    Name = participant.Name,
                    FirstName = participant.FirstName,
                    LastName = participant.LastName,
                    ContactEmail = participant.ContactEmail,
                    ContactTelephone = participant.ContactTelephone,
                    DisplayName = participant.DisplayName,
                    Role = (Role) Enum.Parse(typeof(Role), participant.UserRole.ToString()),
                    HearingRole = participant.HearingRole,
                    ParticipantStatus = (ParticipantStatus) Enum.Parse(typeof(ParticipantStatus),
                        participant.CurrentStatus.ToString()),
                    Username = participant.Username,
                    CaseTypeGroup = participant.CaseTypeGroup,
                    Representee = participant.Representee
                })
                .ToList();

            var endpoints = conferenceResponse.Endpoints == null ? new List<Endpoint>() : conferenceResponse.Endpoints.Select(EndpointCacheMapper.MapEndpointToCacheModel).ToList();
            var conference = new Conference
            {
                Id = conferenceResponse.Id,
                HearingId = conferenceResponse.HearingId,
                Participants = participants,
                HearingVenueName = conferenceResponse.HearingVenueName,
                Endpoints = endpoints
            };
            return conference;
        }
    }
}
