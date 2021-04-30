using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface IConsultationResponseCache
    {
        Task CreateInvitationEntry(ConsultationInvitation consultationInvitation);
        Task<ConsultationInvitation> GetInvitation(Guid invitationId);
        Task UpdateResponseToInvitation(Guid invitationId, Guid participantId, ConsultationAnswer answer);
        Task DeleteInvitationEntry(Guid invitationId);
    }
}
