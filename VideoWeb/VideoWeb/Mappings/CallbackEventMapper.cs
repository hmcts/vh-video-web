using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;
using RoomType = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.Mappings
{
    public static class CallbackEventMapper
    {
        public static CallbackEvent MapConferenceEventToCallbackEventModel(ConferenceEventRequest request, Conference conference)
        {
            var eventType = Enum.Parse<EventType>(request.Event_type.ToString());
            var conferenceId = Guid.Parse(request.Conference_id);
            Guid.TryParse(request.Participant_id, out var participantId);

            var transferFrom = MapRoom(request.Transfer_from.ToString());
            var transferTo = MapRoom(request.Transfer_to.ToString());
            
            var callbackEvent = new CallbackEvent
            {
                EventId = request.Event_id,
                EventType = eventType,
                ConferenceId = conferenceId,
                Reason = request.Reason,
                TransferTo = transferTo,
                TransferFrom = transferFrom,
                TimeStampUtc = request.Time_stamp_utc,
                ParticipantId = participantId
            };
            
            if (IsEndpointJoined(callbackEvent, conference))
            {
                callbackEvent.EventType = EventType.EndpointJoined;
            }

            if (IsEndpointDisconnected(callbackEvent, conference))
            {
                callbackEvent.EventType = EventType.EndpointDisconnected;
            }

            return callbackEvent;
        }

        private static bool IsEndpointJoined(CallbackEvent callbackEvent, Conference conference)
        {
            return callbackEvent.EventType == EventType.Joined &&
                   conference.Endpoints.Any(x => x.Id == callbackEvent.ParticipantId);
        }
        
        private static bool IsEndpointDisconnected(CallbackEvent callbackEvent, Conference conference)
        {
            return callbackEvent.EventType == EventType.Disconnected &&
                   conference.Endpoints.Any(x => x.Id == callbackEvent.ParticipantId);
        }

        private static RoomType? MapRoom(string room)
        {
            if (string.IsNullOrWhiteSpace(room))
            {
                return null;
            }
            
            if (Enum.TryParse(room, out RoomType transferToCheck))
            {
                return transferToCheck;
            }

            return null;
        }
    }
}
