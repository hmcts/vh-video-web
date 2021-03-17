using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;

namespace VideoWeb.Services
{
    public interface IConsultationResponseTracker
    {
        void UpdateConsultationResponse(Conference conference, Guid participantId, ConsultationAnswer answer);
        bool HaveAllParticipantsAccepted(Conference conference, Guid participantId);
    }

    public class ConsultationResponseTracker : IConsultationResponseTracker
    {
        public readonly Dictionary<long, List<Guid>> AcceptedConsultations = new Dictionary<long, List<Guid>>();
        
        public void UpdateConsultationResponse(Conference conference, Guid participantId, ConsultationAnswer answer)
        {
            var participant = conference.Participants.First(x => x.Id == participantId);
            if (!participant.LinkedParticipants.Any())
            {
                return;
            }
            
            var interpreterRoom = GetRoomForParticipant(conference, participant);

            if (answer == ConsultationAnswer.Rejected)
            {
                StopTrackingResponsesForInterpreterRoom(interpreterRoom.Id);
            }

            if (AcceptedConsultations.ContainsKey(interpreterRoom.Id))
            {
                AcceptedConsultations[interpreterRoom.Id].Add(participantId);
            }
            else
            {
                AcceptedConsultations.Add(interpreterRoom.Id, new List<Guid>{participantId});
            }
        }
        
        private void StopTrackingResponsesForInterpreterRoom(long interpreterRoomId)
        {
            AcceptedConsultations.Remove(interpreterRoomId);
        }

        public bool HaveAllParticipantsAccepted(Conference conference, Guid participantId)
        {
            var participant = conference.Participants.First(x => x.Id == participantId);
            if (!participant.LinkedParticipants.Any())
            {
                return true;
            }

            var interpreterRoom = GetRoomForParticipant(conference, participant);
            if (!AcceptedConsultations.ContainsKey(interpreterRoom.Id))
            {
                return false;
            }

            var participantsAccepted = AcceptedConsultations[interpreterRoom.Id];
            return interpreterRoom.Participants.All(participantsAccepted.Contains);
        }

        private CivilianRoom GetRoomForParticipant(Conference conference, Participant participant)
        {
            return conference.CivilianRooms.First(r => r.Participants.Contains(participant.Id));
        }
    }
}
