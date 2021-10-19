using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public class DistributedConsultationInvitationCache : RedisCacheBase<Guid, ConsultationInvitation>, IConsultationInvitationCache
    {
        public DistributedConsultationInvitationCache(IDistributedCache distributedCache) : base(distributedCache)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromMinutes(2.5)
            };
        }

        public async Task WriteToCache(ConsultationInvitation consultationInvitation)
        {
            await base.WriteToCache(consultationInvitation.InvitationId, consultationInvitation); 
        }

        public override string GetKey(Guid key)
        {
            return key.ToString();
        }
    }
}
