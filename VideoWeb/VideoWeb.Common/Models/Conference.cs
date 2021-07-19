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
            Participants.Add(participant);
        }

        public void RemoveParticipant(Guid referenceId)
        {
            Participants.RemoveAll(x => x.RefId == referenceId);
        }

        public void UpdateParticipant(UpdateParticipantRequest participantRequest)
        {
            var participant = Participants.FirstOrDefault(x => x.RefId == participantRequest.ParticipantRefId);
            participant.Name = participantRequest.Fullname;
            participant.FirstName = participantRequest.FirstName;
            participant.LastName = participantRequest.LastName;
            participant.DisplayName = participantRequest.DisplayName;
            participant.Representee = participantRequest.Representee;
            participant.ContactEmail = participantRequest.ContactEmail;
            participant.ContactTelephone = participantRequest.ContactTelephone;
            participant.Username = participantRequest.Username;
            participant.LinkedParticipants = participantRequest.LinkedParticipants.Select(x => new LinkedParticipant() { LinkedId = x.LinkedRefId, LinkType = (LinkType)x.Type }).ToList();
        }

        private CivilianRoom GetOrCreateCivilianRoom(long roomId)
        {
            var room = CivilianRooms.FirstOrDefault(x => x.Id == roomId);
            if (room != null) return room;
            room = new CivilianRoom {Id = roomId};
            CivilianRooms.Add(room);

            return room;
        }

        public CivilianRoom GetCurrentRoom(Guid participantId)
        {
            return CivilianRooms.FirstOrDefault(room => room.Participants.Contains(participantId));
        }
    }
}
