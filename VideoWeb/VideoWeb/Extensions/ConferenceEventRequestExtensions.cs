using System.Collections.Generic;
using System.Linq;
using Castle.Core.Internal;
using Newtonsoft.Json;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using RoomType = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.Extensions
{
    public static class ConferenceEventRequestExtensions
    {
        public static bool IsParticipantAndVmrEvent(this ConferenceEventRequest request)
        {
            return !request.ParticipantRoomId.IsNullOrEmpty() && !request.ParticipantId.IsNullOrEmpty();
        }

        public static bool IsParticipantAVmr(this ConferenceEventRequest request, Conference conference,
            out long roomId)
        {
            if (!long.TryParse(request.ParticipantRoomId, out roomId)) return false;
            var id = roomId;
            return conference.CivilianRooms.Any(x => x.Id == id);
        }

        public static List<ConferenceEventRequest> CreateEventsForParticipantsInRoom(
            this ConferenceEventRequest request, Conference conference, long roomId)
        {
            var civilianRoom = conference.CivilianRooms.First(x => x.Id == roomId);
            return civilianRoom.Participants.Where(x=>x.ToString()== request.ParticipantId).Select(p =>
                {
                    var json = JsonConvert.SerializeObject(request);
                    var participantEventRequest = JsonConvert.DeserializeObject<ConferenceEventRequest>(json);
                    participantEventRequest.ParticipantId = p.ToString();
                    participantEventRequest.ParticipantRoomId = roomId.ToString();
                    participantEventRequest.EventType = request.EventType switch
                    {
                        EventType.Joined when !participantEventRequest.ParticipantRoomId.IsNullOrEmpty() &&
                                              conference.CurrentStatus == ConferenceState.InSession => EventType
                            .RoomParticipantTransfer,
                        EventType.Joined when !participantEventRequest.ParticipantRoomId.IsNullOrEmpty() => EventType
                            .RoomParticipantJoined,
                        EventType.Disconnected when !participantEventRequest.ParticipantRoomId.IsNullOrEmpty() =>
                            EventType
                                .RoomParticipantDisconnected,
                        EventType.Transfer when !participantEventRequest.ParticipantRoomId.IsNullOrEmpty() => EventType
                            .RoomParticipantTransfer,
                        _ => participantEventRequest.EventType
                    };
                    participantEventRequest.TransferTo = request.EventType switch
                    {
                        EventType.Joined when !participantEventRequest.ParticipantRoomId.IsNullOrEmpty() &&
                                              conference.CurrentStatus == ConferenceState.InSession => nameof(RoomType.HearingRoom),
                        _ => request.TransferTo
                    };
                    return participantEventRequest;
                })
                .ToList();
        }

        public static ConferenceEventRequest UpdateEventTypeForVideoApi(this ConferenceEventRequest request, Conference conference, long roomId)
        {
            request.EventType = request.EventType switch
            {
                EventType.Joined when !request.ParticipantRoomId.IsNullOrEmpty() &&
                                              conference.CurrentStatus == ConferenceState.InSession => EventType
                            .RoomParticipantTransfer,
                EventType.Joined when !request.ParticipantRoomId.IsNullOrEmpty() => EventType
                    .RoomParticipantJoined,
                EventType.Disconnected when !request.ParticipantRoomId.IsNullOrEmpty() => EventType
                    .RoomParticipantDisconnected,
                EventType.Transfer when !request.ParticipantRoomId.IsNullOrEmpty() => EventType
                    .RoomParticipantTransfer,
                _ => request.EventType
            };
            return request;
        }
    }
}
