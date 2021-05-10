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
        Task<bool> HaveAllParticipantsAccepted(Guid invitationId);
        Task<bool> HaveAllParticipantsResponded(Guid invitationId);
    }

    public class ConsultationInvitationTracker : IConsultationInvitationTracker
    {
        private readonly IConsultationInvitationCache _consultationInvitationCache;

        public ConsultationInvitationTracker(IConsultationInvitationCache consultationInvitationCache)
        {
            _consultationInvitationCache = consultationInvitationCache;
        }

        public async Task<Guid> StartTrackingInvitation(Conference conference, string roomLabel, Guid requestedParticipantId)
        {
            var requestedParticipant = conference.Participants.FirstOrDefault(p => p.Id == requestedParticipantId);

            if (requestedParticipant == null) 
                return Guid.Empty;
            
            var consultationInvitation = ConsultationInvitation.Create(requestedParticipantId, roomLabel, requestedParticipant.LinkedParticipants.Select(linkedParticipant => linkedParticipant.LinkedId));
            await _consultationInvitationCache.Write(consultationInvitation);
            return consultationInvitation.InvitationId;
        }

        public async Task<ConsultationInvitation> GetInvitation(Guid invitationId)
        {
            if (invitationId == Guid.Empty)
                return null;
            
            return await _consultationInvitationCache.Read(invitationId);
        }

        public async Task UpdateConsultationResponse(Guid invitationId, Guid participantId, ConsultationAnswer answer)
        {
            var invitation = await _consultationInvitationCache.Read(invitationId);

            if (invitation == null)
                return;

            invitation.InvitedParticipantResponses[participantId] = answer;

            await _consultationInvitationCache.Write(invitation);
        }

        public async Task<bool> HaveAllParticipantsAccepted(Guid invitationId)
        {
            var invitation = await _consultationInvitationCache.Read(invitationId);
            return invitation?.HaveAllAccepted ?? false;
        }

        public async Task<bool> HaveAllParticipantsResponded(Guid invitationId)
        {
            var invitation = await _consultationInvitationCache.Read(invitationId);
            return invitation?.HaveAllResponded ?? false;
        }
    }
}
