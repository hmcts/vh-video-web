using System;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface IConsultationInvitationCache
    {
        Task WriteToCache(ConsultationInvitation consultationInvitation, CancellationToken cancellationToken = default);
        Task<ConsultationInvitation> ReadFromCache(Guid invitationId, CancellationToken cancellationToken = default);
    }
}
