using System.Collections.Generic;
using System.Linq;
using Castle.Core.Internal;
using Newtonsoft.Json;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;

namespace VideoWeb.Extensions
{
    public static class ConferenceEventRequestExtensions
    {
        public static bool IsParticipantAndVmrEvent(this ConferenceEventRequest request)
        {
            return !request.ParticipantRoomId.IsNullOrEmpty() && !request.ParticipantId.IsNullOrEmpty();
        }

        public static bool IsParticipantInVmr(this ConferenceEventRequest request, Conference conference)
        {
            return conference.CivilianRooms.Any(x => x.Id.ToString() == request.ParticipantRoomId) && conference
                .CivilianRooms.First(x => x.Id.ToString() == request.ParticipantRoomId)
                .Participants.Any(x => x.ToString() == request.ParticipantId);
        }
        public static IEnumerable<Participant> GetOtherParticipantsInVmr(this ConferenceEventRequest request, Conference conference)
        {
            if (conference.CivilianRooms.Any(x => x.Id.ToString() == request.ParticipantRoomId))
            {
                var participantIds = conference.CivilianRooms.First(x => x.Id.ToString() == request.ParticipantRoomId)
                    .Participants.FindAll(x => x.ToString() != request.ParticipantId);
            
                return conference.Participants.Where(x => participantIds.Contains(x.Id));
            }
            return new List<Participant>();
        }

        public static bool IsParticipantAVmr(this ConferenceEventRequest request, Conference conference,
            out long roomId)
        {
            if (!long.TryParse(request.ParticipantId, out roomId)) return false;
            var id = roomId;
            return conference.CivilianRooms.Any(x => x.Id == id);
        }

        public static List<ConferenceEventRequest> CreateEventsForParticipantsInRoom(
            this ConferenceEventRequest request, Conference conference, long roomId)
        {
            return conference.CivilianRooms.First(x => x.Id == roomId).Participants.Select(p =>
                {
                    var json = JsonConvert.SerializeObject(request);
                    var participantEventRequest = JsonConvert.DeserializeObject<ConferenceEventRequest>(json);
                    participantEventRequest.ParticipantId = p.ToString();
                    participantEventRequest.ParticipantRoomId = roomId.ToString();
                    participantEventRequest.EventType = request.EventType switch
                    {
                        EventType.Joined when !participantEventRequest.ParticipantRoomId.IsNullOrEmpty() => EventType
                            .RoomParticipantJoined,
                        EventType.Disconnected when !participantEventRequest.ParticipantRoomId.IsNullOrEmpty() =>
                            EventType
                                .RoomParticipantDisconnected,
                        EventType.Transfer when !participantEventRequest.ParticipantRoomId.IsNullOrEmpty() => EventType
                            .RoomParticipantTransfer,
                        _ => participantEventRequest.EventType
                    };
                    
                    return participantEventRequest;
                })
                .ToList();
        }

        public static ConferenceEventRequest UpdateEventTypeForVideoApi(this ConferenceEventRequest request)
        {
            request.EventType = request.EventType switch
            {
                EventType.Joined when !request.ParticipantRoomId.IsNullOrEmpty() => EventType.RoomParticipantJoined,
                EventType.Disconnected when !request.ParticipantRoomId.IsNullOrEmpty() => EventType
                    .RoomParticipantDisconnected,
                EventType.Transfer when !request.ParticipantRoomId.IsNullOrEmpty() => EventType.RoomParticipantTransfer,
                _ => request.EventType
            };
            return request;
        }
    }
}
