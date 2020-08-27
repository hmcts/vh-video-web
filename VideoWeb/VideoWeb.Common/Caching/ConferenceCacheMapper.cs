using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

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
                    RefId = participant.Ref_id,
                    Name = participant.Name,
                    FirstName = participant.First_name,
                    LastName = participant.Last_name,
                    ContactEmail = participant.Contact_email,
                    ContactTelephone = participant.Contact_telephone,
                    DisplayName = participant.Display_name,
                    Role = (Role) Enum.Parse(typeof(Role), participant.User_role.ToString()),
                    ParticipantStatus = (ParticipantStatus) Enum.Parse(typeof(ParticipantStatus),
                        participant.Current_status.ToString()),
                    Username = participant.Username,
                    CaseTypeGroup = participant.Case_type_group,
                })
                .ToList();

            var endpoints = conferenceResponse.Endpoints == null ? new List<Endpoint>() : conferenceResponse.Endpoints.Select(EndpointCacheMapper.MapEndpointToCacheModel).ToList();
            var conference = new Conference
            {
                Id = conferenceResponse.Id,
                HearingId = conferenceResponse.Hearing_id,
                Participants = participants,
                HearingVenueName = conferenceResponse.Hearing_venue_name,
                Endpoints = endpoints
            };
            return conference;
        }
    }

    public static class EndpointCacheMapper
    {
        public static Endpoint MapEndpointToCacheModel(EndpointResponse endpointResponse)
        {
            return new Endpoint
            {
                Id = endpointResponse.Id,
                DisplayName = endpointResponse.Display_name,
                EndpointStatus = (EndpointStatus) Enum.Parse(typeof(EndpointStatus), endpointResponse.Status.ToString())
            };
        }
    }
}
