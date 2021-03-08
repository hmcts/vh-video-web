using System.Collections.Generic;
using System.Linq;
using Castle.Core.Internal;
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

        public static List<ConferenceEventRequest> CreateEventsForParticipantsInRoom(this ConferenceEventRequest request,
            Conference conference, long roomId)
        {
            return conference.CivilianRooms.First(x => x.Id == roomId).Participants.Select(p =>
            {
                var participantEventRequest = new ConferenceEventRequest
                {
                    ConferenceId = request.ConferenceId,
                    EventId = request.EventId,
                    EventType = request.EventType,
                    ParticipantId = p.ToString(),
                    ParticipantRoomId = roomId.ToString(),
                    Phone = request.Phone,
                    Reason = request.Reason,
                    TimeStampUtc = request.TimeStampUtc,
                    TransferFrom = request.TransferFrom,
                    TransferTo = request.TransferTo
                };
                return participantEventRequest;
            }).ToList();
        }
    }
}
