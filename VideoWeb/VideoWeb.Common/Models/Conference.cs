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
            ConsultationRooms = new List<ParticipantRoom>();
        }

        public Guid Id { get; set; }
        public Guid HearingId { get; set; }
        public List<Participant> Participants { get; set; }
        public List<Endpoint> Endpoints { get; set; }
        public List<CivilianRoom> CivilianRooms { get; set; }
        public List<ParticipantRoom> ConsultationRooms { get; set; }
        public string HearingVenueName { get; set; }
        public ConferenceState CurrentStatus { get; set; }

        public Participant GetJudge()
        {
            return Participants.SingleOrDefault(x => x.IsJudge());
        }

        public void AddParticipantToConsultationRoom(string roomLabel, Participant participant)
        {
            var consultationRoom = UpsertConsultationRoom(roomLabel, true);
            participant.CurrentRoom = consultationRoom;
        }
        
        public void AddEndpointToConsultationRoom(string roomLabel, Endpoint endpoint)
        {
            var consultationRoom = UpsertConsultationRoom(roomLabel, true);
            endpoint.CurrentRoom = consultationRoom;
        }
        
        public void RemoveParticipantFromConsultationRoom(Participant participant, string roomLabel)
        {
            if (participant.CurrentRoom != null)
            {
                participant.CurrentRoom = null;
            }
            
            CheckAndRemoveEmptyConsultationRoom(roomLabel);
        }
        
        public void RemoveEndpointFromConsultationRoom(Endpoint endpoint, string roomLabel)
        {
            if (endpoint.CurrentRoom != null)
            {
                endpoint.CurrentRoom = null;
            }
            
            CheckAndRemoveEmptyConsultationRoom(roomLabel);
        }

        /// <summary>
        /// Check if the room is empty and remove it if so
        /// </summary>
        /// <param name="roomLabel"></param>
        private void CheckAndRemoveEmptyConsultationRoom(string roomLabel)
        {
            var roomIsEmpty = Participants.TrueForAll(x => x.CurrentRoom?.Label != roomLabel) && 
                              Endpoints.TrueForAll(x => x.CurrentRoom?.Label != roomLabel);
            
            if (roomIsEmpty)
            {
                ConsultationRooms.RemoveAll(x => x.Label == roomLabel);
            }
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
            room.Participants.Remove(participantId);
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
        
        public bool IsParticipantInConference(string username)
        {
            return Participants.Exists(p => p.Username.Equals(username, StringComparison.InvariantCultureIgnoreCase));
        }

        public Participant GetParticipant(string username)
        {
            return Participants.Find(p => p.Username.Equals(username, StringComparison.InvariantCultureIgnoreCase));
        }
        
        public Participant GetParticipant(Guid id)
        {
            return Participants.Find(p => p.Id == id);
        }

        public void UpdateParticipant(UpdateParticipant updateParticipant)
        {
            var participant = Participants.Find(x => x.RefId == updateParticipant.ParticipantRefId);
            if(participant == null) return;
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
            var room = CivilianRooms.Find(x => x.Id == roomId);
            if (room != null) return room;
            room = new CivilianRoom {Id = roomId};
            CivilianRooms.Add(room);

            return room;
        }

        public CivilianRoom GetRoom(Guid participantId)
        {
            return CivilianRooms.Find(room => room.Participants.Contains(participantId));
        }

        public HearingLayout GetRecommendedLayout()
        {
            var numOfParticipantsIncJudge = Participants.Count + Endpoints.Count;
            return numOfParticipantsIncJudge switch
            {
                >= 10 => HearingLayout.TwoPlus21,
                >= 6 => HearingLayout.OnePlus7,
                _ => HearingLayout.Dynamic
            };
        }

        public ParticipantRoom UpsertConsultationRoom(string roomLabel, bool roomLocked)
        {
            var consultationRoom = ConsultationRooms.Find(x => x.Label == roomLabel);
            if (consultationRoom == null)
            {
                consultationRoom = new ParticipantRoom {Label = roomLabel, Locked = roomLocked};
                ConsultationRooms.Add(consultationRoom);
            }

            consultationRoom.Locked = roomLocked;
            return consultationRoom;
        }
    }
}
