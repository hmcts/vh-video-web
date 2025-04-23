using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using LinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;
using Supplier = VideoWeb.Common.Enums.Supplier;

namespace VideoWeb.Common.Caching;

public static class ConferenceCacheMapper
{
    public const string NotRequired = "Not Required";
    public const string NotAllocated = "Not Allocated";
    
    public static Conference MapConferenceToCacheModel(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse)
    {
        var participants = conferenceResponse
            .Participants
            .Select(p => MapParticipantToCacheModel(p, hearingDetailsResponse))
            .ToList();

        var telephoneParticipants = conferenceResponse
            .TelephoneParticipants
            .Select(TelephoneParticipantCacheMapper.MapTelephoneToCacheModel)
            .ToList();

        var endpointsForHearing = hearingDetailsResponse.Endpoints.ToList();
        
        var caseInformation = hearingDetailsResponse.Cases.Find(c => c.IsLeadCase) ?? hearingDetailsResponse.Cases[0];
        
        var endpoints = conferenceResponse.Endpoints == null
            ? new List<Endpoint>()
            : conferenceResponse.Endpoints.Select(e => EndpointCacheMapper.MapEndpointToCacheModel(e, endpointsForHearing.Find(x => x.DisplayName == e.DisplayName))).ToList();
        
        var civilianRooms = conferenceResponse.CivilianRooms == null
            ? new List<CivilianRoom>()
            : conferenceResponse.CivilianRooms.Select(CivilianRoomCacheMapper.MapCivilianRoomToCacheModel).ToList();
        
        var meetingRoom = conferenceResponse.MeetingRoom == null
            ? null
            : new ConferenceMeetingRoom
            {
                ParticipantUri = conferenceResponse.MeetingRoom.ParticipantUri,
                PexipNode = conferenceResponse.MeetingRoom.PexipNode,
                PexipSelfTest = conferenceResponse.MeetingRoom.PexipSelfTestNode,
                AdminUri = conferenceResponse.MeetingRoom.AdminUri
            };
        
        var conference = new Conference();
        conference.Id = conferenceResponse.Id;
        conference.HearingId = hearingDetailsResponse.Id;
        conference.Participants = participants;
        conference.HearingVenueName = hearingDetailsResponse.HearingVenueName;
        conference.Endpoints = endpoints;
        conference.TelephoneParticipants = telephoneParticipants;
        conference.CivilianRooms = civilianRooms;
        conference.CurrentStatus = GetConferenceStatus(conferenceResponse.CurrentStatus);
        conference.IsWaitingRoomOpen = conferenceResponse.IsWaitingRoomOpen;
        conference.CaseName = caseInformation.Name;
        conference.CaseNumber = caseInformation.Number;
        conference.CaseType = hearingDetailsResponse.ServiceName.Trim();
        conference.ScheduledDateTime = hearingDetailsResponse.ScheduledDateTime;
        conference.ScheduledDuration = hearingDetailsResponse.ScheduledDuration;
        conference.ClosedDateTime = conferenceResponse.ClosedDateTime;
        conference.AudioRecordingRequired = hearingDetailsResponse.AudioRecordingRequired;
        conference.IsScottish = hearingDetailsResponse.IsHearingVenueScottish;
        conference.IngestUrl = conferenceResponse.IngestUrl;
        conference.MeetingRoom = meetingRoom;
        conference.CreatedDateTime = hearingDetailsResponse.CreatedDate;
        conference.TelephoneConferenceId = conferenceResponse.TelephoneConferenceId;
        conference.TelephoneConferenceNumbers = conferenceResponse.TelephoneConferenceNumbers;


        if (hearingDetailsResponse.SupportsWorkAllocation)
        {
            conference.UpdateAllocation(
                hearingDetailsResponse.AllocatedToId,
                hearingDetailsResponse.AllocatedToName ?? NotAllocated,
                hearingDetailsResponse.AllocatedToUsername);
        }
        else
        {
            conference.UpdateAllocation(null, NotRequired, NotRequired);
        }

        conference.Supplier = (Supplier)hearingDetailsResponse.BookingSupplier;
        return conference;
    }
    
    private static Participant MapParticipantToCacheModel(ParticipantResponse participant, HearingDetailsResponseV2 hearingDetails)
    {
        var participantDetails = hearingDetails.Participants?.SingleOrDefault(x => x.Id == participant.RefId);
        var judiciaryDetails = hearingDetails.JudicialOfficeHolders?.SingleOrDefault(x
            => String.Equals(x.Email, participant.Username, StringComparison.OrdinalIgnoreCase));
        
        var model =
            ParticipantCacheMapper.Map(participant, participantDetails) ??
            ParticipantCacheMapper.Map(participant, judiciaryDetails) ??
            ParticipantCacheMapper.Map(participant);
        
        model.LinkedParticipants = (participant.LinkedParticipants ?? new List<LinkedParticipantResponse>()).Select(MapLinkedParticipantToCacheModel).ToList();
        
        return model;
    }
    
    private static LinkedParticipant MapLinkedParticipantToCacheModel(LinkedParticipantResponse linkedParticipant)
    {
        return new LinkedParticipant
        {
            LinkedId = linkedParticipant.LinkedId,
            LinkType = Enum.Parse<LinkType>(linkedParticipant.Type.ToString(), true)
        };
    }
    
    private static ConferenceStatus GetConferenceStatus(ConferenceState state)
    {
        if (!Enum.TryParse(state.ToString(), true, out ConferenceStatus status))
        {
            status = ConferenceStatus.NotStarted;
        }
        
        return status;
    }
}
