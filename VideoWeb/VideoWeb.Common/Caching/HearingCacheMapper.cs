using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public static class HearingCacheMapper
    {
        public static Conference MapHearingToCacheModel(ConferenceDetailsResponse conferenceResponse)
        {
            var participants = conferenceResponse
                .Participants
                .Select(ParticipantCacheMapper.MapParticipantToCacheModel)
                .ToList();

            var endpoints = conferenceResponse.Endpoints == null
                ? new List<Endpoint>()
                : conferenceResponse.Endpoints.Select(EndpointCacheMapper.MapEndpointToCacheModel).ToList();

            var civilianRooms = conferenceResponse.CivilianRooms == null
                ? new List<CivilianRoom>()
                : conferenceResponse.CivilianRooms.Select(CivilianRoomCacheMapper.MapCivilianRoomToCacheModel)
                    .ToList();
            
            var conference = new Conference
            {
                Id = conferenceResponse.Id,
                HearingId = conferenceResponse.HearingId,
                Participants = participants,
                HearingVenueName = conferenceResponse.HearingVenueName,
                Endpoints = endpoints,
                CivilianRooms = civilianRooms,
                CurrentStatus = conferenceResponse.CurrentStatus
            };
            return conference;
        }
    }
}
