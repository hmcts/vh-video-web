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
                .Select(MapParticipantToCacheModel)
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
                CivilianRooms = civilianRooms
            };
            return conference;
        }

        private static Participant MapParticipantToCacheModel(ParticipantDetailsResponse participant)
        {
            var links = (participant.LinkedParticipants ?? new List<LinkedParticipantResponse>())
                .Select(MapLinkedParticipantToCacheModel).ToList();
            return new Participant
            {
                Id = participant.Id,
                RefId = participant.RefId,
                Name = participant.Name,
                FirstName = participant.FirstName,
                LastName = participant.LastName,
                ContactEmail = participant.ContactEmail,
                ContactTelephone = participant.ContactTelephone,
                DisplayName = participant.DisplayName,
                Role = Enum.Parse<Role>(participant.UserRole.ToString(), true),
                HearingRole = participant.HearingRole,
                ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true),
                Username = participant.Username,
                CaseTypeGroup = participant.CaseTypeGroup,
                Representee = participant.Representee,
                LinkedParticipants = links
            };
        }

        private static LinkedParticipant MapLinkedParticipantToCacheModel(
            LinkedParticipantResponse linkedParticipant)
        {
            return new LinkedParticipant
            {
                LinkedId = linkedParticipant.LinkedId,
                LinkType = Enum.Parse<LinkType>(linkedParticipant.Type.ToString(), true)
            };
        }
    }
}
