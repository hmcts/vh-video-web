using System;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;
using RoomType = VideoWeb.EventHub.Enums.RoomType;

namespace VideoWeb.Mappings
{
    public class CallbackEventMapper
    {
        public CallbackEvent MapConferenceEventToCallbackEventModel(ConferenceEventRequest request)
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
                TimeStampUtc = request.Time_stamp_utc.GetValueOrDefault(),
                ParticipantId = participantId
            };

            return callbackEvent;
        }

        private RoomType? MapRoom(string room)
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