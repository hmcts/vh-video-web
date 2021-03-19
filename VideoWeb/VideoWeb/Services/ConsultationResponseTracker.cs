using System;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.Services
{
    public interface IConsultationResponseTracker
    {
        Task UpdateConsultationResponse(Conference conference, Guid participantId, ConsultationAnswer answer);
        Task<bool> HaveAllParticipantsAccepted(Conference conference, Guid participantId);
        
        Task ClearResponses(Conference conference, Guid participantId);
    }

    public class ConsultationResponseTracker : IConsultationResponseTracker
    {
        private readonly IConsultationResponseCache _cache;

        public ConsultationResponseTracker(IConsultationResponseCache cache)
        {
            _cache = cache;
        }

        public async Task UpdateConsultationResponse(Conference conference, Guid participantId,
            ConsultationAnswer answer)
        {
            var participant = conference.Participants.First(x => x.Id == participantId);
            if (!participant.LinkedParticipants.Any())
            {
                return;
            }

            var interpreterRoom = GetRoomForParticipant(conference, participant);

            if (answer == ConsultationAnswer.Rejected)
            {
                await StopTrackingResponsesForInterpreterRoom(interpreterRoom.Id);
            }

            var acceptedConsultations = await _cache.GetResponses(interpreterRoom.Id);
            if (!acceptedConsultations.Contains(participantId))
            {
                acceptedConsultations.Add(participantId);
            }

            await _cache.AddOrUpdateResponses(interpreterRoom.Id, acceptedConsultations);
        }

        private async Task StopTrackingResponsesForInterpreterRoom(long interpreterRoomId)
        {
            await _cache.ClearResponses(interpreterRoomId);
        }

        public async Task<bool> HaveAllParticipantsAccepted(Conference conference, Guid participantId)
        {
            var participant = conference.Participants.First(x => x.Id == participantId);
            if (!participant.LinkedParticipants.Any())
            {
                return true;
            }

            var interpreterRoom = GetRoomForParticipant(conference, participant);
            var participantsAccepted = await _cache.GetResponses(interpreterRoom.Id);
            return interpreterRoom.Participants.All(participantsAccepted.Contains);
        }

        public async Task ClearResponses(Conference conference, Guid participantId)
        {
            var participant = conference.Participants.First(x => x.Id == participantId);
            var interpreterRoom = GetRoomForParticipant(conference, participant);
            await StopTrackingResponsesForInterpreterRoom(interpreterRoom.Id);
        }

        private CivilianRoom GetRoomForParticipant(Conference conference, Participant participant)
        {
            return conference.CivilianRooms.First(r => r.Participants.Contains(participant.Id));
        }
    }
}
