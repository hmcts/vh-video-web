using System;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.Helpers
{
    public interface IConsultationInvitationTracker
    {
        Task<Guid> StartTrackingInvitation(Conference conference, string roomLabel, Guid requestedParticipantId);
        Task<ConsultationInvitation> GetInvitation(Guid invitationId);
        Task UpdateConsultationResponse(Guid invitationId, Guid participantId, ConsultationAnswer answer);
        Task StopTrackingInvitation(Guid invitationId);
        Task<bool> HaveAllParticipantsAccepted(Guid invitationId);
        Task<bool> HaveAllParticipantsResponded(Guid invitationId);
        Task StopTrackingInvitationsForParticipant(Guid participantId);
    }

    public class ConsultationInvitationTracker : IConsultationInvitationTracker
    {
        private readonly IConsultationInvitationCache _cache;

        public ConsultationInvitationTracker(IConsultationInvitationCache cache)
        {
            _cache = cache;
        }

        public async Task<Guid> StartTrackingInvitation(Conference conference, string roomLabel, Guid requestedParticipantId)
        {
            var requestedParticipant = conference.Participants.FirstOrDefault(p => p.Id == requestedParticipantId);

            if (requestedParticipant == null) 
                return Guid.Empty;
            
            var consultationInvitation = ConsultationInvitation.Create(requestedParticipantId, roomLabel, requestedParticipant.LinkedParticipants.Select(linkedParticipant => linkedParticipant.LinkedId));
            await _cache.CreateInvitationEntry(consultationInvitation);
            return consultationInvitation.InvitationId;
        }

        public async Task<ConsultationInvitation> GetInvitation(Guid invitationId)
        {
            if (invitationId == Guid.Empty)
                return null;
            
            return await _cache.GetInvitation(invitationId);
        }

        public async Task UpdateConsultationResponse(Guid invitationId, Guid participantId, ConsultationAnswer answer)
        {
            await _cache.UpdateResponseToInvitation(invitationId, participantId, answer);
        }

        public async Task StopTrackingInvitation(Guid invitationId)
        {
            await _cache.DeleteInvitationEntry(invitationId);
        }

        public async Task<bool> HaveAllParticipantsAccepted(Guid invitationId)
        {
            var invitation = await _cache.GetInvitation(invitationId);
            return invitation?.HaveAllAccepted ?? false;
        }

        public async Task<bool> HaveAllParticipantsResponded(Guid invitationId)
        {
            var invitation = await _cache.GetInvitation(invitationId);
            return invitation?.HaveAllResponded ?? false;
        }

        public async Task StopTrackingInvitationsForParticipant(Guid participantId)
        {
            var invitations = await _cache.GetInvitationsForParticipant(participantId);
            await Task.WhenAll(invitations.Select(x => _cache.DeleteInvitationEntry(x.InvitationId)));
        }
    }
}
