using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using VideoApi.Contract.Requests;
using Supplier = VideoWeb.Common.Enums.Supplier;

namespace VideoWeb.Common.Models
{
    public class Conference
    {
        public Conference()
        {
            Participants = new List<Participant>();
            Endpoints = new List<Endpoint>();
            TelephoneParticipants = new List<TelephoneParticipant>();
            CivilianRooms = new List<CivilianRoom>();
            ConsultationRooms = new List<ConsultationRoom>();
        }

        public Guid Id { get; set; }
        public Guid HearingId { get; set; }
        public List<Participant> Participants { get; set; }
        public List<Endpoint> Endpoints { get; set; }
        public List<TelephoneParticipant> TelephoneParticipants { get; set; }
        public List<CivilianRoom> CivilianRooms { get; set; }
        public List<ConsultationRoom> ConsultationRooms { get; set; }
        public string HearingVenueName { get; set; }
        public ConferenceStatus CurrentStatus { get; set; }
        public string CaseName { get; set; }
        public string CaseNumber { get; set; }
        public string CaseType { get; set; }
        public DateTime ScheduledDateTime { get; set; }
        public int ScheduledDuration { get; set; }
        public DateTime? ClosedDateTime { get; set; }
        public bool AudioRecordingRequired {get; set; }
        public bool IsWaitingRoomOpen { get; set; }
        public bool IsScottish { get; set; }
        public string IngestUrl { get; set; }
        public ConferenceMeetingRoom MeetingRoom { get; set; }
        public DateTime CreatedDateTime { get; set; }
        public string TelephoneConferenceId { get; set; }
        public string TelephoneConferenceNumbers { get; set; }
        public Supplier Supplier { get; set; }
        /// <summary>
        /// This is the time stamp of the last event that was sent for a change to the conference (not for participants)
        /// </summary>
        public DateTime? LastEventTime { get; set; }

        public bool CountdownComplete { get; set; }
        
        /// <summary>
        /// The username of the allocated CSO
        /// </summary>
        [JsonInclude]
        public string AllocatedCsoUsername { get; private set; }
        
        /// <summary>
        /// The full name of the allocated CSO
        /// </summary>
        [JsonInclude]
        public string AllocatedCso { get; private set; }
        
        /// <summary>
        /// The id of the allocated CSO
        /// </summary>
        [JsonInclude]
        public Guid? AllocatedCsoId { get; private set; }

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
        
        public void RemoveParticipantById(Guid participantId)
        {
            Participants.RemoveAll(x => x.Id == participantId);
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

        public void UpdateParticipantStatus(Participant participant, ParticipantStatus status, DateTime? lastEventTime)
        {
            var participantToUpdate = Participants.Find(p => p.Id == participant.Id);
            if (participantToUpdate == null) return;
            participantToUpdate.ParticipantStatus = status;
            if (lastEventTime.HasValue)
            {
                participantToUpdate.LastEventTime = lastEventTime.Value;
            }

            if(participantToUpdate.CurrentRoom != null && status == ParticipantStatus.Disconnected)
            {
                RemoveParticipantFromConsultationRoom(participantToUpdate, participantToUpdate.CurrentRoom.Label);
            }
        }
        
        public void UpdateEndpointStatus(Endpoint endpoint, EndpointStatus status, DateTime lastEventTime)
        {
            var endpointToUpdate = Endpoints.Find(p => p.Id == endpoint.Id);
            if (endpointToUpdate == null) return;
            endpointToUpdate.EndpointStatus = status;
            endpointToUpdate.LastEventTime = lastEventTime;
        }

        private CivilianRoom GetOrCreateCivilianRoom(long roomId)
        {
            var room = CivilianRooms.Find(x => x.Id == roomId);
            if (room != null) return room;
            room = new CivilianRoom {Id = roomId};
            CivilianRooms.Add(room);

            return room;
        }

        /// <summary>
        /// Check if any of the participants or endpoints from the given list are screened from each other.
        /// If any of the externalReferenceIds for an entity exist in the protectFrom list of another entity, they
        /// cannot be in a consultation together.
        /// </summary>
        /// <param name="participantIds">List of participants to be in a consultation</param>
        /// <param name="endpointIds">List of endpoints to be in a consultation</param>
        public bool AreEntitiesScreenedFromEachOther(List<Guid> participantIds, List<Guid> endpointIds)
        {
            var allExternalReferenceIds = Participants
                .Where(p => participantIds.Contains(p.Id) && SupportsScreening(p))
                .Select(x => x.ExternalReferenceId)
                .Union(Endpoints.Where(e => endpointIds.Contains(e.Id)).Select(e => e.ExternalReferenceId)).ToList();
            
            foreach (var participantId in participantIds)
            {
                var participant = Participants.Find(x => x.Id == participantId);
                if (participant != null && participant.ProtectFrom.Exists(allExternalReferenceIds.Contains))
                {
                    return true;
                }
            }
            
            foreach (var endpointId in endpointIds)
            {
                var endpoint = Endpoints.Find(x => x.Id == endpointId);
                if (endpoint != null && endpoint.ProtectFrom.Exists(allExternalReferenceIds.Contains))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool SupportsScreening(Participant participant1)
        {
            return !participant1.IsQuickLinkUser() && !participant1.IsHost() && !participant1.IsJudicialOfficeHolder();
        }

        /// <summary>
        /// Check if the participant is screened from any of the entities in a existing consultation room
        /// </summary>
        /// <param name="roomLabel">The label of the consultation room</param>
        /// <param name="participantId">The id of the participant attempting to join a consultation room</param>
        /// <returns>true if the participant is not screened from any of the entities in the room</returns>
        public bool CanParticipantJoinConsultationRoom(string roomLabel, Guid participantId)
        {
            var participant = Participants.Find(x => x.Id == participantId);
            if (participant == null)
                throw new BadRequestException($"The participant {participantId} does not exist");
            
            if(participant.IsObserver())
                throw new BadRequestException($"The participant {participantId} is an observer and cannot join a consultation room");
            
            var ids = GetParticipantsAndEndpointsInRoom(roomLabel);
            ids.participantIds.Add(participantId);

            return !AreEntitiesScreenedFromEachOther(ids.participantIds, ids.endpointIds);
        }

        /// <summary>
        /// Check if the endpoint is screened from any of the entities in a existing consultation room
        /// </summary>
        /// <param name="roomLabel">The label of the consultation room</param>
        /// <param name="endpointId">The id of the endpoint attempting to join a consultation room</param>
        /// <returns>true if the endpoint is not screened from any of the entities in the room</returns>
        public bool CanEndpointJoinConsultationRoom(string roomLabel, Guid endpointId)
        {
            var endpoint = Endpoints.Find(x => x.Id == endpointId);
            if (endpoint == null)
                throw new ArgumentException($"The endpoint {endpointId} does not exist", nameof(endpointId));

            var ids = GetParticipantsAndEndpointsInRoom(roomLabel);
            ids.endpointIds.Add(endpointId);

            return !AreEntitiesScreenedFromEachOther(ids.participantIds, ids.endpointIds);
        }

        private (List<Guid> participantIds, List<Guid> endpointIds) GetParticipantsAndEndpointsInRoom(string roomLabel)
        {
            var participants = Participants.Where(x => x.CurrentRoom?.Label == roomLabel).Select(x => x.Id).ToList();
            var endpoints = Endpoints.Where(x => x.CurrentRoom?.Label == roomLabel).Select(x => x.Id).ToList();
            return (participants, endpoints);
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

        public ConsultationRoom UpsertConsultationRoom(string roomLabel, bool roomLocked)
        {
            var consultationRoom = ConsultationRooms.Find(x => x.Label == roomLabel);
            if (consultationRoom == null)
            {
                consultationRoom = new ConsultationRoom {Label = roomLabel, Locked = roomLocked};
                ConsultationRooms.Add(consultationRoom);
            }

            consultationRoom.Locked = roomLocked;
            return consultationRoom;
        }

        public void UpdateConferenceStatus(ConferenceStatus newState, DateTime eventTimestamp)
        {
            CurrentStatus = newState;
            LastEventTime = eventTimestamp;
            if(newState is ConferenceStatus.Closed or ConferenceStatus.Paused or ConferenceStatus.Suspended)
            {
                CountdownComplete = false;
            }
        }

        public void UpdateClosedDateTime(DateTime? newClosedDateTime)
        {
            ClosedDateTime = newClosedDateTime;
        }

        public void AddTelephoneParticipant(Guid id, string phoneNumber)
        {
            if (TelephoneParticipants.Exists(x => x.Id == id)) return;
            TelephoneParticipants.Add(new TelephoneParticipant
                { Id = id, PhoneNumber = phoneNumber, Connected = true, Room = RoomType.WaitingRoom });
        }
        
        public void RemoveTelephoneParticipant(Guid id)
        {
            TelephoneParticipants.RemoveAll(x => x.Id == id);
        }

        public List<Guid> GetNonScreenedParticipantsAndEndpoints()
        {
            var hasScreening = Participants.Exists(x => x.ProtectFrom.Count > 0) ||
                               Endpoints.Exists(x => x.ProtectFrom.Count > 0);
            if (!hasScreening)
            {
                return Participants.Where(x=> x.IsHost()).Select(x=> x.Id).ToList();
            }
            var participants = GetNonScreenedParticipants();
            var endpoints = GetNonScreenedEndpoints();
            
            return participants
                .Select(p => p.Id)
                .Union(endpoints.Select(e => e.Id))
                .ToList();
        }
        
        private List<Participant> GetNonScreenedParticipants()
        {
            var participants = Participants
                .Where(x => x.ProtectFrom.Count == 0)
                .Where(x => !Participants.Exists(p => p.ProtectFrom.Contains(x.ExternalReferenceId)))
                .Where(x => !Endpoints.Exists(e => e.ProtectFrom.Contains(x.ExternalReferenceId)))
                .ToList();
            
            return participants;
        }
        
        private List<Endpoint> GetNonScreenedEndpoints()
        {
            var endpoints = Endpoints
                .Where(x => x.ProtectFrom.Count == 0)
                .Where(x => !Participants.Exists(p => p.ProtectFrom.Contains(x.ExternalReferenceId)))
                .Where(x => !Endpoints.Exists(e => e.ProtectFrom.Contains(x.ExternalReferenceId)))
                .ToList();
            
            return endpoints;
        }

        public void UpdateAllocation(Guid? updateAllocatedCsoId, string updateAllocatedToName, string updateAllocatedCsoUsername)
        {
            AllocatedCsoId = updateAllocatedCsoId;
            AllocatedCso = updateAllocatedToName;
            AllocatedCsoUsername = updateAllocatedCsoUsername;
        }
    }
}
