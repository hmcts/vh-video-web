using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using UserApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public class DistributedConsultationResponseCache : IConsultationResponseCache
    {
        private readonly IDistributedCache _distributedCache;

        public Task CreateInvitationEntry(ConsultationInvitation consultationInvitation)
        {
            throw new NotImplementedException();
        }

        public Task<ConsultationInvitation> GetInvitation(Guid invitationId)
        {
            throw new NotImplementedException();
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
