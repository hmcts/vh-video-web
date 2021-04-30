using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.Helpers
{
    public interface IConsultationNotifier
    {
        Task<Guid> NotifyConsultationRequestAsync(Conference conference, string roomLabel, Guid requestedById,
            Guid requestedForId);

        Task NotifyConsultationResponseAsync(Conference conference, Guid invitationId, string roomLabel,
            Guid requestedForId, ConsultationAnswer answer);

        Task NotifyRoomUpdateAsync(Conference conference, Room room);
    }
    
    public class ConsultationNotifier : IConsultationNotifier
    {
        
        private readonly IHubContext<EventHub.Hub.EventHub, IEventHubClient> _hubContext;
        private readonly IConsultationResponseTracker _consultationResponseTracker;

        public ConsultationNotifier(IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext, IConsultationResponseTracker consultationResponseTracker)
        {
            _hubContext = hubContext;
            _consultationResponseTracker = consultationResponseTracker;
        }

        public async Task<Guid> NotifyConsultationRequestAsync(Conference conference, string roomLabel, Guid requestedById, Guid requestedForId)
        {
            var participantFor = conference.Participants.First(x => x.Id == requestedForId);
            var invitationId = await _consultationResponseTracker.StartTrackingInvitation(conference, roomLabel, requestedForId);

            var tasks = conference.Participants.Select(p =>
                _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                    .RequestedConsultationMessage(conference.Id, invitationId, roomLabel, requestedById, participantFor.Id));
            await Task.WhenAll(tasks);
            if (participantFor.LinkedParticipants.Any())
            {
                await NotifyLinkedParticipantsOfConsultationRequest(conference, invitationId, participantFor, roomLabel, requestedById);
            }

            return invitationId;
        }
        
        private async Task NotifyLinkedParticipantsOfConsultationRequest(Conference conference, Guid invitationId, Participant participantFor, string roomLabel, Guid requestedById)
        {
            var linkedIds = participantFor.LinkedParticipants.Select(x => x.LinkedId);
            var linkedParticipants = conference.Participants.Where(p => linkedIds.Contains(p.Id));

            foreach (var linkedParticipant in linkedParticipants)
            {
                var tasks = conference.Participants.Select(p =>
                    _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                        .RequestedConsultationMessage(conference.Id, invitationId, roomLabel, requestedById, linkedParticipant.Id));
                await Task.WhenAll(tasks);  
            }
        }

        public async Task NotifyConsultationResponseAsync(Conference conference, Guid invitationId, string roomLabel, Guid requestedForId,
            ConsultationAnswer answer)
        {
            var endpoint = conference.Endpoints.FirstOrDefault(e => e.Id == requestedForId);
            if (endpoint != null)
            {
                await PublishResponseMessage(conference, invitationId, roomLabel, endpoint.Id, answer, endpoint.Id);
                return;
            }
            
            var participantFor = conference.Participants.First(x => x.Id == requestedForId);
            await _consultationResponseTracker.UpdateConsultationResponse(invitationId, participantFor.Id, answer);
            
            var haveAllAccepted =
                await _consultationResponseTracker.HaveAllParticipantsAccepted(invitationId);

            await PublishResponseMessage(conference, invitationId, roomLabel, participantFor.Id, answer, participantFor.Id);

            if (answer == ConsultationAnswer.Accepted && !haveAllAccepted)
                return;

            if (participantFor.LinkedParticipants.Any())
            {
                await NotifyLinkedParticipantsOfConsultationResponseAsync(conference, invitationId, participantFor, roomLabel, answer);

                if (answer != ConsultationAnswer.Accepted)
                {
                    await _consultationResponseTracker.StopTrackingInvitation(invitationId);
                }
            }
        }
        
        private async Task NotifyLinkedParticipantsOfConsultationResponseAsync(Conference conference, Guid invitationId, Participant participantFor, string roomLabel, ConsultationAnswer answer)
        {
            var linkedIds = participantFor.LinkedParticipants.Select(x => x.LinkedId);
            var linkedParticipants = conference.Participants.Where(p => linkedIds.Contains(p.Id));

            foreach (var linkedParticipant in linkedParticipants)
            {
                await PublishResponseMessage(conference, invitationId, roomLabel, linkedParticipant.Id, answer, participantFor.Id);
            }
        }
        
        private async Task PublishResponseMessage(Conference conference, Guid invitationId, string roomLabel, Guid requestedForId, ConsultationAnswer answer, Guid responseInitiatorId)
        {
            var tasks = conference.Participants.Select(p => 
                _hubContext.Clients?.Group(p.Username.ToLowerInvariant())
                    .ConsultationRequestResponseMessage(conference.Id, invitationId, roomLabel, requestedForId, answer, responseInitiatorId) ?? Task.CompletedTask);
            await Task.WhenAll(tasks);
        }

        public async Task NotifyRoomUpdateAsync(Conference conference, Room room)
        {
            var tasks = conference.Participants.Select(p =>
                _hubContext.Clients?.Group(p.Username.ToLowerInvariant())
                    .RoomUpdate(room) ?? Task.CompletedTask);
            await Task.WhenAll(tasks);
        }
    }
}
