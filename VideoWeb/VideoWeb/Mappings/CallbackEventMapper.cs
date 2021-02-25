using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.Mappings
{
    public class CallbackEventMapper : IMapTo<ConferenceEventRequest, Conference, CallbackEvent>
    {
        public CallbackEvent Map(ConferenceEventRequest request, Conference conference)
        {
            var eventType = Enum.Parse<EventType>(request.Event_type.ToString());
            var conferenceId = Guid.Parse(request.Conference_id);
            Guid.TryParse(request.Participant_id, out var participantId);
            
            var callbackEvent = new CallbackEvent
            {
                EventId = request.Event_id,
                EventType = eventType,
                ConferenceId = conferenceId,
                Reason = request.Reason,
                TransferTo = request.Transfer_to,
                TransferFrom = request.Transfer_from,
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
            
            if (IsEndpointTransferred(callbackEvent, conference))
            {
                callbackEvent.EventType = EventType.EndpointTransfer;
            }

            return callbackEvent;
        }

        private bool IsEndpointJoined(CallbackEvent callbackEvent, Conference conference)
        {
            return callbackEvent.EventType == EventType.Joined &&
                   conference.Endpoints.Any(x => x.Id == callbackEvent.ParticipantId);
        }
        
        private bool IsEndpointDisconnected(CallbackEvent callbackEvent, Conference conference)
        {
            return callbackEvent.EventType == EventType.Disconnected &&
                   conference.Endpoints.Any(x => x.Id == callbackEvent.ParticipantId);
        }
        
        private bool IsEndpointTransferred(CallbackEvent callbackEvent, Conference conference)
        {
            return callbackEvent.EventType == EventType.Transfer &&
                   conference.Endpoints.Any(x => x.Id == callbackEvent.ParticipantId);
        }
    }
}
