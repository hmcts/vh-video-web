using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.EventHub.Services;

namespace VideoWeb.Helpers;

public class ConsultationNotifier(
    IHubContext<EventHub.Hub.EventHubVIH11189, IEventHubClient> hubContext,
    IConsultationInvitationTracker consultationInvitationTracker)
    : IConsultationNotifier
{
    public async Task<Guid> NotifyConsultationRequestAsync(Conference conference, string roomLabel, Guid requestedById, Guid requestedForId)
    {
        var participantFor = conference.Participants.First(x => x.Id == requestedForId);
        var invitationId = await consultationInvitationTracker.StartTrackingInvitation(conference, roomLabel, requestedForId);
        
        var tasks = conference.Participants.Select(p =>
            hubContext.Clients.Group(p.Username.ToLowerInvariant())
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
                hubContext.Clients.Group(p.Username.ToLowerInvariant())
                    .RequestedConsultationMessage(conference.Id, invitationId, roomLabel, requestedById, linkedParticipant.Id));
            await Task.WhenAll(tasks);
        }
    }
    
    public async Task NotifyConsultationResponseAsync(Conference conference, Guid invitationId, string roomLabel, Guid requestedForId,
        ConsultationAnswer answer)
    {
        var endpoint = conference.Endpoints.Find(e => e.Id == requestedForId);
        if (endpoint != null)
        {
            await PublishResponseMessage(conference, invitationId, roomLabel, endpoint.Id, answer, endpoint.Id);
            return;
        }
        
        var participantFor = conference.Participants.First(x => x.Id == requestedForId);
        await consultationInvitationTracker.UpdateConsultationResponse(invitationId, participantFor.Id, answer);
        
        var haveAllAccepted =
            await consultationInvitationTracker.HaveAllParticipantsAccepted(invitationId);
        
        await PublishResponseMessage(conference, invitationId, roomLabel, participantFor.Id, answer, participantFor.Id);
        
        if (answer == ConsultationAnswer.Accepted && !haveAllAccepted)
            return;
        
        if (participantFor.LinkedParticipants.Any())
            await NotifyLinkedParticipantsOfConsultationResponseAsync(conference, invitationId, participantFor, roomLabel, answer);
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
            hubContext.Clients.Group(p.Username.ToLowerInvariant())
                .ConsultationRequestResponseMessage(conference.Id, invitationId, roomLabel, requestedForId, answer, responseInitiatorId) ?? Task.CompletedTask);
        await Task.WhenAll(tasks);
    }
    
    public async Task NotifyRoomUpdateAsync(Conference conference, Room room)
    {
        var tasks = conference.Participants.Select(p =>
            hubContext.Clients.Group(p.Username.ToLowerInvariant())
                .RoomUpdate(room) ?? Task.CompletedTask);
        await Task.WhenAll(tasks);
    }
    
    public async Task NotifyParticipantTransferring(Conference conference, Guid participantId, string roomLabel)
    {
        var tasks = conference.Participants.Select(p =>
            hubContext.Clients.Group(p.Username.ToLowerInvariant())
                .ConsultationRequestResponseMessage(conference.Id, Guid.Empty, roomLabel, participantId, ConsultationAnswer.Transferring, participantId) ?? Task.CompletedTask);
        await Task.WhenAll(tasks);
    }
}
