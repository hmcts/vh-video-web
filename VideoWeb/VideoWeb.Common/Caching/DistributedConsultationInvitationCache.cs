using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching;

public sealed class DistributedConsultationInvitationCache(
    IDistributedCache distributedCache,
    ILogger<DistributedConsultationInvitationCache> logger)
    : RedisCacheBase<Guid, ConsultationInvitation>(distributedCache, logger), IConsultationInvitationCache
{
    public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; } = new()
    {
        SlidingExpiration = TimeSpan.FromMinutes(2.5)
    };
    
    public async Task WriteToCache(ConsultationInvitation consultationInvitation, CancellationToken cancellationToken = default)
    {
        await base.WriteToCache(consultationInvitation.InvitationId, consultationInvitation, cancellationToken);
    }
    
    protected override string GetKey(Guid key)
    {
        return key.ToString();
    }
}
