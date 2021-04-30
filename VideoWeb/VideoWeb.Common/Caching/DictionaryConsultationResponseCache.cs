using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public class DictionaryConsultationResponseCache : IConsultationResponseCache
    {
        private readonly ConcurrentDictionary<Guid, ConsultationInvitation> _cache;

        public DictionaryConsultationResponseCache()
        {
            _cache = new ConcurrentDictionary<Guid, ConsultationInvitation>();
        }

        public Task CreateInvitationEntry(ConsultationInvitation consultationInvitation)
        {
            _cache[consultationInvitation.InvitationId] = consultationInvitation;
            return Task.CompletedTask;
        }

        public Task<ConsultationInvitation> GetInvitation(Guid invitationId)
        {
            return Task.FromResult(_cache[invitationId]);
        }

        public Task UpdateResponseToInvitation(Guid invitationId, Guid participantId, ConsultationAnswer answer)
        {
            throw new NotImplementedException();
        }

        public Task DeleteInvitationEntry(Guid invitationId)
        {
            throw new NotImplementedException();
        }
    }
}
