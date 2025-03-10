using System;
using System.Collections.Generic;
using System.Linq;
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
            return conference.CivilianRooms.Exists(x => x.Id.ToString() == request.ParticipantRoomId) && conference
                .CivilianRooms.First(x => x.Id.ToString() == request.ParticipantRoomId)
                .Participants.Exists(x => x.ToString() == request.ParticipantId);
        }
        public static IEnumerable<Participant> GetOtherParticipantsInVmr(this ConferenceEventRequest request, Conference conference)
        {
            if (conference.CivilianRooms.Exists(x => x.Id.ToString() == request.ParticipantRoomId))
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
            return conference.CivilianRooms.Exists(x => x.Id == id);
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

        public static ConferenceEventRequest Clone(this ConferenceEventRequest originalRequest)
        {
            return new ConferenceEventRequest
            {
                ConferenceId = originalRequest.ConferenceId,
                Phone = originalRequest.Phone,
                Reason = originalRequest.Reason,
                EventId = originalRequest.EventId,
                EventType = originalRequest.EventType,
                ParticipantId = originalRequest.ParticipantId,
                TransferFrom = originalRequest.TransferFrom,
                TransferTo = originalRequest.TransferTo,
                ParticipantRoomId = originalRequest.ParticipantRoomId,
                TimeStampUtc = originalRequest.TimeStampUtc
            };
        }
        
        public static ConferenceEventRequest UpdateEventTypeForVideoApi(this ConferenceEventRequest request)
        {
            var videoApiRequest = request.Clone();
            videoApiRequest.EventType = request.EventType switch
            {
                EventType.Joined when !request.ParticipantRoomId.IsNullOrEmpty() => EventType.RoomParticipantJoined,
                EventType.Disconnected when !request.ParticipantRoomId.IsNullOrEmpty() => EventType
                    .RoomParticipantDisconnected,
                EventType.Transfer when !request.ParticipantRoomId.IsNullOrEmpty() => EventType.RoomParticipantTransfer,
                _ => request.EventType
            };

            return videoApiRequest;
        }
        
        public static void SetRoleForParticipantEvent(this ConferenceEventRequest request, Conference conference)
        {
            ArgumentNullException.ThrowIfNull(conference);
            if (string.IsNullOrWhiteSpace(request.ParticipantId)) return;
            var role = conference.GetNonScreenedParticipantsAndEndpoints().Contains(Guid.Parse(request.ParticipantId))
                ? ConferenceRole.Host
                : ConferenceRole.Guest;
            request.ConferenceRole = role;
        }
    }
}
