using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.Helpers
{
    public interface IConsultationResponseTracker
    {
        Task<Guid> StartTrackingInvitation(Conference conference, Guid requestedParticipantId);
        Task<ConsultationInvitation> GetInvitation(Guid invitationId);
        Task UpdateConsultationResponse(Guid invitationId, Guid participantId, ConsultationAnswer answer);
        Task StopTrackingInvitation(Guid invitationId);
        Task<bool> HaveAllParticipantsAccepted(Guid invitationId);
        Task<bool> HaveAllParticipantsResponded(Guid invitationId);
    }

    public class ConsultationResponseTracker : IConsultationResponseTracker
    {
        private readonly IConsultationResponseCache _cache;

        public ConsultationResponseTracker(IConsultationResponseCache cache)
        {
            _cache = cache;
        }

        public async Task<Guid> StartTrackingInvitation(Conference conference, Guid requestedParticipantId)
        {
            var requestedParticipant = conference.Participants.FirstOrDefault(p => p.Id == requestedParticipantId);
            
            if (requestedParticipant?.LinkedParticipants.Any() != true) 
                return Guid.Empty;
            
            var consultationInvitation = new ConsultationInvitation(requestedParticipantId, requestedParticipant.LinkedParticipants.Select(x => x.LinkedId));
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
            var invitation = await _cache.GetInvitation(invitationId);
            
            if (invitation != null) 
                invitation.InvitedParticipantResponses[participantId] = answer;
        }

        public async Task StopTrackingInvitation(Guid invitationId)
        {
            await _cache.DeleteInvitationEntry(invitationId);
        }

        public async Task<bool> HaveAllParticipantsAccepted(Guid invitationId)
        {
            var invitation = await _cache.GetInvitation(invitationId);
            return invitation?.HaveAllAccepted ?? true;
        }

        public async Task<bool> HaveAllParticipantsResponded(Guid invitationId)
        {
            var invitation = await _cache.GetInvitation(invitationId);
            return invitation?.HaveAllResponded ?? true;
        }
    }
}
