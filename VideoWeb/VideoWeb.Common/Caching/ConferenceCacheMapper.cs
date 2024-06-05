using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public static class ConferenceCacheMapper
    {
        public static ConferenceDto MapConferenceToCacheModel(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse)
        {
            var participants = conferenceResponse
                .Participants
                .Select(MapParticipantToCacheModel)
                .ToList();

            var endpoints = conferenceResponse.Endpoints == null
                ? new List<EndpointDto>()
                : conferenceResponse.Endpoints.Select(EndpointCacheMapper.MapEndpointToCacheModel).ToList();
            
            foreach (var endpoint in endpoints)
            {
                endpoint.EndpointParticipants = hearingDetailsResponse.Endpoints
                    .Single(x => x.Id == endpoint.Id).EndpointParticipants?
                    .Select(x => EndpointParticipantCacheMapper.MapEndpointParticipantToCacheModel(x, participants))
                    .ToList();
            }

            var civilianRooms = conferenceResponse.CivilianRooms == null
                ? new List<CivilianRoomDto>()
                : conferenceResponse.CivilianRooms.Select(CivilianRoomCacheMapper.MapCivilianRoomToCacheModel)
                    .ToList();
            
            var meetingRoom = conferenceResponse.MeetingRoom == null
                ? null
                : new ConferenceMeetingRoom
                {
                    ParticipantUri = conferenceResponse.MeetingRoom.ParticipantUri,
                    PexipNode = conferenceResponse.MeetingRoom.PexipNode,
                    PexipSelfTest = conferenceResponse.MeetingRoom.PexipSelfTestNode,
                };
            
            var conference = new ConferenceDto
            {
                Id = conferenceResponse.Id,
                HearingId = conferenceResponse.HearingId,
                Participants = participants,
                HearingVenueName = conferenceResponse.HearingVenueName,
                Endpoints = endpoints,
                CivilianRooms = civilianRooms,
                CurrentStatus = conferenceResponse.CurrentStatus,
                IsWaitingRoomOpen = conferenceResponse.IsWaitingRoomOpen,
                CaseName = conferenceResponse.CaseName,
                CaseNumber = conferenceResponse.CaseNumber,
                CaseType = conferenceResponse.CaseType,
                ScheduledDateTime = conferenceResponse.ScheduledDateTime,
                ScheduledDuration = conferenceResponse.ScheduledDuration,
                ClosedDateTime = conferenceResponse.ClosedDateTime,
                AudioRecordingRequired = conferenceResponse.AudioRecordingRequired,
                IsScottish = conferenceResponse.HearingVenueIsScottish,
                IngestUrl = conferenceResponse.IngestUrl,
                MeetingRoom = meetingRoom
            };
            return conference;
        }

        private static ParticipantDto MapParticipantToCacheModel(ParticipantDetailsResponse participant)
        {
            var links = (participant.LinkedParticipants ?? new List<LinkedParticipantResponse>()).Select(MapLinkedParticipantToCacheModel).ToList();
            return new ParticipantDto
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
                LinkedParticipants = links,
                CurrentRoom = RoomCacheMapper.Map(participant.CurrentRoom),
                InterpreterRoom = RoomCacheMapper.Map(participant.CurrentInterpreterRoom)
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
