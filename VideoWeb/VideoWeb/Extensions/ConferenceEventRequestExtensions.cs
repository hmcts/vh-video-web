using System.Collections.Generic;
using System.Linq;
using Castle.Core.Internal;
using Newtonsoft.Json;
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

        public static bool IsParticipantAVmr(this ConferenceEventRequest request, Conference conference,
            out long roomId)
        {
            if (!long.TryParse(request.ParticipantId, out roomId)) return false;
            var id = roomId;
            return conference.CivilianRooms.Any(x => x.Id == id);
        }

        public static List<ConferenceEventRequest> CreateEventsForParticipantsInRoom(
            this ConferenceEventRequest request,
            Conference conference, long roomId)
        {
            return conference.CivilianRooms.First(x => x.Id == roomId).Participants.Select(p =>
            {
                var json = JsonConvert.SerializeObject(request);
                var participantEventRequest = JsonConvert.DeserializeObject<ConferenceEventRequest>(json);
                participantEventRequest.ParticipantId = p.ToString();
                participantEventRequest.ParticipantRoomId = roomId.ToString();
                return participantEventRequest;
            }).ToList();
        }
    }
}
