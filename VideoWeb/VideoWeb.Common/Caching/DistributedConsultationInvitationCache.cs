using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public class DistributedConsultationInvitationCache : RedisCacheBase<Guid, ConsultationInvitation>, IConsultationInvitationCache
    {
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        public DistributedConsultationInvitationCache(
            IDistributedCache distributedCache,
            ILogger<RedisCacheBase<Guid, ConsultationInvitation>> logger) : base(distributedCache, logger)
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

        protected override string GetKey(Guid key)
        {
            return key.ToString();
        }
    }
}
