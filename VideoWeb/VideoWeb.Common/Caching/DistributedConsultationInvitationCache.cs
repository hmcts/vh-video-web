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
    public class DistributedConsultationInvitationCache : IConsultationInvitationCache
    {
        private readonly IDistributedCache _distributedCache;

        public DistributedConsultationInvitationCache(IDistributedCache distributedCache)
        {
            _distributedCache = distributedCache;
        }

        public async Task Write(ConsultationInvitation consultationInvitation)
        {
            var serialisedConference = JsonConvert.SerializeObject(consultationInvitation, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedConference);
            await _distributedCache.SetAsync(consultationInvitation.InvitationId.ToString(), data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromMinutes(2.5)
                });
        }

        public async Task<ConsultationInvitation> Read(Guid invitationId)
        {
            try
            {
                var data = await _distributedCache.GetAsync(invitationId.ToString());
                var profileSerialised = Encoding.UTF8.GetString(data);
                var invite =
                    JsonConvert.DeserializeObject<ConsultationInvitation>(profileSerialised,
                        CachingHelper.SerializerSettings);
                return invite;
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
