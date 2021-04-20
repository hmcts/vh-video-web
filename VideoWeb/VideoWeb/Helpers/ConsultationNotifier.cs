using System;
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
        Task NotifyConsultationRequestAsync(Conference conference, string roomLabel, Guid requestedById,
            Guid requestedForId);

        Task NotifyConsultationResponseAsync(Conference conference, string roomLabel,
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

        public async Task NotifyConsultationRequestAsync(Conference conference, string roomLabel, Guid requestedById, Guid requestedForId)
        {
            var participantFor = conference.Participants.First(x => x.Id == requestedForId);
            
            var tasks = conference.Participants.Select(p =>
                _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                    .RequestedConsultationMessage(conference.Id, roomLabel, requestedById, participantFor.Id));
            await Task.WhenAll(tasks);
            if (participantFor.LinkedParticipants.Any())
            {
                await NotifyLinkedParticipantsOfConsultationRequest(conference, participantFor, roomLabel, requestedById);
            }
        }
        
        private async Task NotifyLinkedParticipantsOfConsultationRequest(Conference conference, Participant participantFor, string roomLabel, Guid requestedById)
        {
            var linkedIds = participantFor.LinkedParticipants.Select(x => x.LinkedId);
            var linkedParticipants = conference.Participants.Where(p => linkedIds.Contains(p.Id));

            foreach (var linkedParticipant in linkedParticipants)
            {
                var tasks = conference.Participants.Select(p =>
                    _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                        .RequestedConsultationMessage(conference.Id, roomLabel, requestedById, linkedParticipant.Id));
                await Task.WhenAll(tasks);  
            }
        }

        public async Task NotifyConsultationResponseAsync(Conference conference, string roomLabel, Guid requestedForId,
            ConsultationAnswer answer)
        {
            var endpoint = conference.Endpoints.FirstOrDefault(e => e.Id == requestedForId);
            if (endpoint != null)
            {
                await PublishResponseMessage(conference, roomLabel, endpoint.Id, answer);
                return;
            }
            
            var participantFor = conference.Participants.First(x => x.Id == requestedForId);
            await _consultationResponseTracker.UpdateConsultationResponse(conference, participantFor.Id, answer);
            var haveAllAccepted =
                await _consultationResponseTracker.HaveAllParticipantsAccepted(conference, participantFor.Id);

            await PublishResponseMessage(conference, roomLabel, participantFor.Id, answer);

            if (answer == ConsultationAnswer.Accepted && !haveAllAccepted)
                return;

            if (participantFor.LinkedParticipants.Any())
            {
                await NotifyLinkedParticipantsOfConsultationResponseAsync(conference, participantFor, roomLabel, answer);
            }

            if (answer == ConsultationAnswer.Transferring && participantFor.LinkedParticipants.Any())
            {
                await _consultationResponseTracker.ClearResponses(conference, requestedForId);
            }
        }
        
        private async Task NotifyLinkedParticipantsOfConsultationResponseAsync(Conference conference, Participant participantFor, string roomLabel, ConsultationAnswer answer)
        {
            var linkedIds = participantFor.LinkedParticipants.Select(x => x.LinkedId);
            var linkedParticipants = conference.Participants.Where(p => linkedIds.Contains(p.Id));

            foreach (var linkedParticipant in linkedParticipants)
            {
                await PublishResponseMessage(conference, roomLabel, linkedParticipant.Id, answer, false);
            }
        }
        
        private async Task PublishResponseMessage(Conference conference, string roomLabel, Guid requestedForId, ConsultationAnswer answer, bool sentByClient=true)
        {
            var tasks = conference.Participants.Select(p => 
                _hubContext.Clients?.Group(p.Username.ToLowerInvariant())
                    .ConsultationRequestResponseMessage(conference.Id, roomLabel, requestedForId, answer, sentByClient) ?? Task.CompletedTask);
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
