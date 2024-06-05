using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.EventHub.Services;

namespace VideoWeb.Helpers
{
    public class ConsultationNotifier : IConsultationNotifier
    {
        
        private readonly IHubContext<EventHub.Hub.EventHub, IEventHubClient> _hubContext;
        private readonly IConsultationInvitationTracker _consultationInvitationTracker;

        public ConsultationNotifier(IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext, IConsultationInvitationTracker consultationInvitationTracker)
        {
            _hubContext = hubContext;
            _consultationInvitationTracker = consultationInvitationTracker;
        }

        public async Task<Guid> NotifyConsultationRequestAsync(ConferenceDto conferenceDto, string roomLabel, Guid requestedById, Guid requestedForId)
        {
            var participantFor = conferenceDto.Participants.First(x => x.Id == requestedForId);
            var invitationId = await _consultationInvitationTracker.StartTrackingInvitation(conferenceDto, roomLabel, requestedForId);

            var tasks = conferenceDto.Participants.Select(p =>
                _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                    .RequestedConsultationMessage(conferenceDto.Id, invitationId, roomLabel, requestedById, participantFor.Id));
            await Task.WhenAll(tasks);
            if (participantFor.LinkedParticipants.Any())
            {
                await NotifyLinkedParticipantsOfConsultationRequest(conferenceDto, invitationId, participantFor, roomLabel, requestedById);
            }

            return invitationId;
        }
        
        private async Task NotifyLinkedParticipantsOfConsultationRequest(ConferenceDto conferenceDto, Guid invitationId, ParticipantDto participantDtoFor, string roomLabel, Guid requestedById)
        {
            var linkedIds = participantDtoFor.LinkedParticipants.Select(x => x.LinkedId);
            var linkedParticipants = conferenceDto.Participants.Where(p => linkedIds.Contains(p.Id));

            foreach (var linkedParticipant in linkedParticipants)
            {
                var tasks = conferenceDto.Participants.Select(p =>
                    _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                        .RequestedConsultationMessage(conferenceDto.Id, invitationId, roomLabel, requestedById, linkedParticipant.Id));
                await Task.WhenAll(tasks);  
            }
        }

        public async Task NotifyConsultationResponseAsync(ConferenceDto conferenceDto, Guid invitationId, string roomLabel, Guid requestedForId,
            ConsultationAnswer answer)
        {
            var endpoint = conferenceDto.Endpoints.FirstOrDefault(e => e.Id == requestedForId);
            if (endpoint != null)
            {
                await PublishResponseMessage(conferenceDto, invitationId, roomLabel, endpoint.Id, answer, endpoint.Id);
                return;
            }
            
            var participantFor = conferenceDto.Participants.First(x => x.Id == requestedForId);
            await _consultationInvitationTracker.UpdateConsultationResponse(invitationId, participantFor.Id, answer);
            
            var haveAllAccepted =
                await _consultationInvitationTracker.HaveAllParticipantsAccepted(invitationId);

            await PublishResponseMessage(conferenceDto, invitationId, roomLabel, participantFor.Id, answer, participantFor.Id);

            if (answer == ConsultationAnswer.Accepted && !haveAllAccepted)
                return;

            if (participantFor.LinkedParticipants.Any())
                await NotifyLinkedParticipantsOfConsultationResponseAsync(conferenceDto, invitationId, participantFor, roomLabel, answer);
        }
        
        private async Task NotifyLinkedParticipantsOfConsultationResponseAsync(ConferenceDto conferenceDto, Guid invitationId, ParticipantDto participantDtoFor, string roomLabel, ConsultationAnswer answer)
        {
            var linkedIds = participantDtoFor.LinkedParticipants.Select(x => x.LinkedId);
            var linkedParticipants = conferenceDto.Participants.Where(p => linkedIds.Contains(p.Id));

            foreach (var linkedParticipant in linkedParticipants)
            {
                await PublishResponseMessage(conferenceDto, invitationId, roomLabel, linkedParticipant.Id, answer, participantDtoFor.Id);
            }
        }
        
        private async Task PublishResponseMessage(ConferenceDto conferenceDto, Guid invitationId, string roomLabel, Guid requestedForId, ConsultationAnswer answer, Guid responseInitiatorId)
        {
            var tasks = conferenceDto.Participants.Select(p => 
                _hubContext.Clients?.Group(p.Username.ToLowerInvariant())
                    .ConsultationRequestResponseMessage(conferenceDto.Id, invitationId, roomLabel, requestedForId, answer, responseInitiatorId) ?? Task.CompletedTask);
            await Task.WhenAll(tasks);
        }

        public async Task NotifyRoomUpdateAsync(ConferenceDto conferenceDto, Room room)
        {
            var tasks = conferenceDto.Participants.Select(p =>
                _hubContext.Clients?.Group(p.Username.ToLowerInvariant())
                    .RoomUpdate(room) ?? Task.CompletedTask);
            await Task.WhenAll(tasks);
        }

        public async Task NotifyParticipantTransferring(ConferenceDto conferenceDto, Guid participantId, string roomLabel)
        {
            var tasks = conferenceDto.Participants.Select(p => 
                _hubContext.Clients?.Group(p.Username.ToLowerInvariant())
                    .ConsultationRequestResponseMessage(conferenceDto.Id, Guid.Empty, roomLabel, participantId, ConsultationAnswer.Transferring, participantId) ?? Task.CompletedTask);
            await Task.WhenAll(tasks);
        }
    }
}
