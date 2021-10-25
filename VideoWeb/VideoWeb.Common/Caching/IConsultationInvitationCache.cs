using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface IConsultationInvitationCache
    {
        Task WriteToCache(ConsultationInvitation consultationInvitation);
        Task<ConsultationInvitation> ReadFromCache(Guid invitationId);
    }
}
