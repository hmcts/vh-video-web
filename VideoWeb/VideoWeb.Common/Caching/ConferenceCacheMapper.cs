using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public static class ConferenceCacheMapper
    {
        public static Conference MapConferenceToCacheModel(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse)
        {
            var participants = conferenceResponse
                .Participants
                .Select(p => MapParticipantToCacheModel(p, hearingDetailsResponse.Participants))
                .ToList();

            var endpoints = conferenceResponse.Endpoints == null
                ? new List<Endpoint>()
                : conferenceResponse.Endpoints.Select(EndpointCacheMapper.MapEndpointToCacheModel).ToList();
            
            var civilianRooms = conferenceResponse.CivilianRooms == null
                ? new List<CivilianRoom>()
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
            
            var conference = new Conference
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

        private static Participant MapParticipantToCacheModel(ParticipantDetailsResponse participant, List<ParticipantResponseV2> participantDetails)
        {
            var links = (participant.LinkedParticipants ?? new List<LinkedParticipantResponse>()).Select(MapLinkedParticipantToCacheModel).ToList();
            var participantHearingDetails = participantDetails.Single(x => x.Id == participant.RefId);
            var model = new Participant();
            model.Id = participant.Id;
            model.RefId = participant.RefId;
            model.Name = participant.Name;
            model.FirstName = participantHearingDetails.FirstName;
            model.LastName = participantHearingDetails.LastName;
            model.ContactEmail = participantHearingDetails.ContactEmail;
            model.ContactTelephone = participantHearingDetails.TelephoneNumber;
            model.DisplayName = participantHearingDetails.DisplayName;
            model.Role = Enum.Parse<Role>(participantHearingDetails.UserRoleName, true);
            model.HearingRole = participantHearingDetails.HearingRoleName;
            model.ParticipantStatus = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString(), true);
            model.Username = participantHearingDetails.Username;
            model.CaseTypeGroup = participant.CaseTypeGroup;
            model.Representee = participant.Representee;
            model.LinkedParticipants = links;
            model.CurrentRoomDto = RoomCacheMapper.Map(participant.CurrentRoom);
            model.InterpreterRoomDto = RoomCacheMapper.Map(participant.CurrentInterpreterRoom);
            return model;
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
