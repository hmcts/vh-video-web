using System;
using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;
using VideoWeb.Extensions;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.Mappings;

public static class CallbackEventMapper
{
    public static CallbackEvent Map(ConferenceEventRequest request, Conference conference)
    {
        request.EventType = request.EventType switch
        {
            VideoApi.Contract.Enums.EventType.RoomParticipantJoined 
                => VideoApi.Contract.Enums.EventType.Joined,
            VideoApi.Contract.Enums.EventType.RoomParticipantDisconnected 
                => VideoApi.Contract.Enums.EventType.Disconnected,
            VideoApi.Contract.Enums.EventType.RoomParticipantTransfer 
                => VideoApi.Contract.Enums.EventType.Transfer,
            _ => request.EventType
        };
        var eventType = Enum.Parse<EventType>(request.EventType.ToString());
        var conferenceId = Guid.Parse(request.ConferenceId);
        var otherParticipantsInVmr = request.GetOtherParticipantsInVmr(conference);
        
        Guid.TryParse(request.ParticipantId, out var participantId);
        
        var callbackEvent = new CallbackEvent
        {
            EventId = request.EventId,
            EventType = eventType,
            ConferenceId = conferenceId,
            Reason = request.Reason,
            TransferTo = request.TransferTo,
            TransferFrom = request.TransferFrom,
            TimeStampUtc = request.TimeStampUtc,
            ParticipantId = participantId,
            PhoneNumber = request.Phone,
            IsParticipantInVmr = request.IsParticipantInVmr(conference),
            ConferenceStatus = Enum.Parse<ConferenceState>(conference.CurrentStatus.ToString())
        };
        
        if (IsEndpointJoined(callbackEvent, conference))
        {
            callbackEvent.EventType = EventType.EndpointJoined;
        }
        
        if (IsEndpointDisconnected(callbackEvent, conference))
        {
            callbackEvent.EventType = EventType.EndpointDisconnected;
        }
        
        if (IsEndpointTransferred(callbackEvent, conference))
        {
            callbackEvent.EventType = EventType.EndpointTransfer;
        }
        
        callbackEvent. IsOtherParticipantsInConsultationRoom = IsOtherParticipantInConsultation(otherParticipantsInVmr);
        return callbackEvent;
    }
    
    private static bool IsEndpointJoined(CallbackEvent callbackEvent, Conference conference)
    {
        return callbackEvent.EventType == EventType.Joined &&
               conference.Endpoints.Exists(x => x.Id == callbackEvent.ParticipantId);
    }
    
    private static bool IsEndpointDisconnected(CallbackEvent callbackEvent, Conference conference)
    {
        return callbackEvent.EventType == EventType.Disconnected &&
               conference.Endpoints.Exists(x => x.Id == callbackEvent.ParticipantId);
    }
    
    private static bool IsEndpointTransferred(CallbackEvent callbackEvent, Conference conference)
    {
        return callbackEvent.EventType == EventType.Transfer &&
               conference.Endpoints.Exists(x => x.Id == callbackEvent.ParticipantId);
    }
    private static bool IsOtherParticipantInConsultation(IEnumerable<Participant> otherParticipantsInVmr)
    {
        return otherParticipantsInVmr.Any(
            p => p.ParticipantStatus == ParticipantStatus.InConsultation);
    }
}
