using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using LinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;

namespace VideoWeb.Common.Caching;

public static class ConferenceCacheMapper
{
    public static Conference MapConferenceToCacheModel(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse)
    {
        var participants = conferenceResponse
            .Participants
            .Select(p => MapParticipantToCacheModel(p, hearingDetailsResponse))
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
            IsScottish = hearingDetailsResponse.IsHearingVenueScottish,
            IngestUrl = conferenceResponse.IngestUrl,
            MeetingRoom = meetingRoom
        };
        return conference;
    }
    
    private static Participant MapParticipantToCacheModel(ParticipantResponse participant, HearingDetailsResponseV2 hearingDetails)
    {
        var participantDetails = hearingDetails.Participants?.SingleOrDefault(x => x.Id == participant.RefId);
        var judiciaryDetails = hearingDetails.JudiciaryParticipants?.SingleOrDefault(x
            => String.Equals(x.Email, participant.Username, StringComparison.OrdinalIgnoreCase));
        
        var model =
            ParticipantCacheMapper.Map(participant, participantDetails) ??
            ParticipantCacheMapper.Map(participant, judiciaryDetails) ??
            ParticipantCacheMapper.Map(participant);
        
        model.LinkedParticipants = (participantDetails?.LinkedParticipants ?? new List<LinkedParticipantResponseV2>()).Select(MapLinkedParticipantToCacheModel).ToList();
        
        return model;
    }
    
    private static LinkedParticipant MapLinkedParticipantToCacheModel(LinkedParticipantResponseV2 linkedParticipant)
    {
        return new LinkedParticipant
        {
            LinkedId = linkedParticipant.LinkedId,
            LinkType = Enum.Parse<LinkType>(linkedParticipant.TypeV2.ToString(), true)
        };
    }
}
