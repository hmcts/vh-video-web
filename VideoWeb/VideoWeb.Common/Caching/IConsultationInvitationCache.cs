using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface IConsultationInvitationCache
    {
        Task Write(ConsultationInvitation consultationInvitation);
        Task<ConsultationInvitation> Read(Guid invitationId);
    }
}
