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
                .Select(MapParticipantToCacheModel)
                .ToList();

            var endpoints = conferenceResponse.Endpoints == null
                ? new List<Endpoint>()
                : conferenceResponse.Endpoints.Select(EndpointCacheMapper.MapEndpointToCacheModel).ToList();

            var civilianRooms = conferenceResponse.Civilian_rooms == null
                ? new List<CivilianRoom>()
                : conferenceResponse.Civilian_rooms.Select(CivilianRoomCacheMapper.MapCivilianRoomToCacheModel)
                    .ToList();
            
            var conference = new Conference
            {
                Id = conferenceResponse.Id,
                HearingId = conferenceResponse.Hearing_id,
                Participants = participants,
                HearingVenueName = conferenceResponse.Hearing_venue_name,
                Endpoints = endpoints,
                CivilianRooms = civilianRooms
            };
            return conference;
        }

        private static Participant MapParticipantToCacheModel(ParticipantDetailsResponse participant)
        {
            var links = (participant.Linked_participants ?? new List<LinkedParticipantResponse>())
                .Select(MapLinkedParticipantToCacheModel).ToList();
            return new Participant
            {
                Id = participant.Id,
                RefId = participant.Ref_id,
                Name = participant.Name,
                FirstName = participant.First_name,
                LastName = participant.Last_name,
                ContactEmail = participant.Contact_email,
                ContactTelephone = participant.Contact_telephone,
                DisplayName = participant.Display_name,
                Role = Enum.Parse<Role>(participant.User_role.ToString(), true),
                HearingRole = participant.Hearing_role,
                ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.Current_status.ToString(), true),
                Username = participant.Username,
                CaseTypeGroup = participant.Case_type_group,
                Representee = participant.Representee,
                LinkedParticipants = links
            };
        }

        private static LinkedParticipant MapLinkedParticipantToCacheModel(
            LinkedParticipantResponse linkedParticipant)
        {
            return new LinkedParticipant
            {
                LinkedId = linkedParticipant.Linked_id,
                LinkType = Enum.Parse<LinkType>(linkedParticipant.Type.ToString(), true)
            };
        }
    }
}
