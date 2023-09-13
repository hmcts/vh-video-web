using System;
using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;

namespace VideoWeb.Common.Models
{
    public class Conference
    {
        public Conference()
        {
            Participants = new List<Participant>();
            Endpoints = new List<Endpoint>();
            CivilianRooms = new List<CivilianRoom>();
        }

        public Guid Id { get; set; }
        public Guid HearingId { get; set; }
        public List<Participant> Participants { get; set; }
        public List<Endpoint> Endpoints { get; set; }
        public List<CivilianRoom> CivilianRooms { get; set; }
        public string HearingVenueName { get; set; }
        public ConferenceState CurrentStatus { get; set; }

        public Participant GetJudge()
        {
            return Participants.SingleOrDefault(x => x.IsJudge());
        }

        public void AddParticipantToRoom(long roomId, Guid participantId)
        {
            var room = GetOrCreateCivilianRoom(roomId);
            if (!room.Participants.Contains(participantId))
            {
                room.Participants.Add(participantId);
            }
        }

        public void RemoveParticipantFromRoom(long roomId, Guid participantId)
        {
            var room = GetOrCreateCivilianRoom(roomId);
            if (room.Participants.Contains(participantId))
            {
                room.Participants.Remove(participantId);
            }
        }

        public void AddParticipant(Participant participant)
        {
            if (!Participants.Exists(p =>
                    p.Username.Equals(participant.Username, StringComparison.InvariantCultureIgnoreCase)))
            {
                Participants.Add(participant);
            }
        }

        public void RemoveParticipant(Guid referenceId)
        {
            Participants.RemoveAll(x => x.RefId == referenceId);
        }

        public void UpdateParticipant(UpdateParticipant updateParticipant)
        {
            var participant = Participants.FirstOrDefault(x => x.RefId == updateParticipant.ParticipantRefId);
            participant.Name = updateParticipant.Fullname;
            participant.FirstName = updateParticipant.FirstName;
            participant.LastName = updateParticipant.LastName;
            participant.DisplayName = updateParticipant.DisplayName;
            participant.Representee = updateParticipant.Representee;
            participant.ContactEmail = updateParticipant.ContactEmail;
            participant.ContactTelephone = updateParticipant.ContactTelephone;
            participant.Username = updateParticipant.Username;
            participant.LinkedParticipants = updateParticipant.LinkedParticipants;
        }

        private CivilianRoom GetOrCreateCivilianRoom(long roomId)
        {
            var room = CivilianRooms.FirstOrDefault(x => x.Id == roomId);
            if (room != null) return room;
            room = new CivilianRoom {Id = roomId};
            CivilianRooms.Add(room);

            return room;
        }

        public CivilianRoom GetRoom(Guid participantId)
        {
            return CivilianRooms.FirstOrDefault(room => room.Participants.Contains(participantId));
        }

        public HearingLayout GetRecommendedLayout()
        {
            var numOfParticipantsIncJudge = Participants.Count + Endpoints.Count;
            if (numOfParticipantsIncJudge >= 10)
            {
                return HearingLayout.TwoPlus21;
            }

            if (numOfParticipantsIncJudge >= 6 && numOfParticipantsIncJudge <= 9)
            {
                return HearingLayout.OnePlus7;
            }

            return HearingLayout.Dynamic;
        }
    }
}
