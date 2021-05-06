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

        public async Task CreateInvitationEntry(ConsultationInvitation consultationInvitation)
        {
            await WriteConsultationInvitationToCache(consultationInvitation);
        }

        public async Task<ConsultationInvitation> GetInvitation(Guid invitationId)
        {
            return await ReadConsultationInvitationToCache(invitationId);
        }

        public async Task UpdateResponseToInvitation(Guid invitationId, Guid participantId, ConsultationAnswer answer)
        {
            var invitation = await GetInvitation(invitationId);

            if (invitation == null)
                return;

            invitation.InvitedParticipantResponses[participantId] = answer;

            await WriteConsultationInvitationToCache(invitation);
        }

        private async Task WriteConsultationInvitationToCache(ConsultationInvitation invitation)
        {

            var serialisedConference = JsonConvert.SerializeObject(invitation, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedConference);
            await _distributedCache.SetAsync(invitation.InvitationId.ToString(), data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromSeconds(2.5 * 60) // 2.5 minutes
                });
        }

        private async Task<ConsultationInvitation> ReadConsultationInvitationToCache(Guid invitationId)
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
