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

            await WriteConsultationInvitationToCache(invitation, false);
        }

        public async Task DeleteInvitationEntry(Guid invitationId)
        {
            await DeleteConsultationInviteFromCache(invitationId);
        }

        public async Task<IEnumerable<ConsultationInvitation>> GetInvitationsForParticipant(Guid participantId)
        {
            return await Task.WhenAll(
                (await ReadParticipantToInvitationLinksFromCache(participantId)).Select(GetInvitation));
        }

        private async Task WriteConsultationInvitationToCache(ConsultationInvitation invitation, bool addLink = true)
        {
            if (addLink)
                await Task.WhenAll(invitation.InvitedParticipantResponses.Select(x =>
                    LinkInvitationToParticipant(invitation.InvitationId, x.Key)));

            var serialisedConference = JsonConvert.SerializeObject(invitation, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedConference);
            await _distributedCache.SetAsync(invitation.InvitationId.ToString(), data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromSeconds(2.5 * 60) // 2.5 minutes
                });
        }

        private async Task DeleteConsultationInviteFromCache(Guid invitationId)
        {
            var invitation = await GetInvitation(invitationId);
            if (invitation == null)
                return;
            
            await Task.WhenAll(
                invitation.InvitedParticipantResponses.Select(x => UnlinkInvitationToParticipant(invitationId, x.Key)));
            
            await _distributedCache.RemoveAsync(invitationId.ToString());
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

        private async Task LinkInvitationToParticipant(Guid invitationId, Guid participantId)
        {
            var invitationsForParticipant =
                await ReadParticipantToInvitationLinksFromCache(participantId) ?? new List<Guid>();
            invitationsForParticipant.Add(invitationId);
            await WriteParticipantToInvitationLinksToCache(participantId, invitationsForParticipant);
        }

        private async Task UnlinkInvitationToParticipant(Guid invitationId, Guid participantId)
        {
            var invitationsForParticipant = await ReadParticipantToInvitationLinksFromCache(participantId);
            invitationsForParticipant.Remove(invitationId);

            if (!invitationsForParticipant.Any())
            {
                await _distributedCache.RemoveAsync(participantId.ToString());
                return;
            }

            await WriteParticipantToInvitationLinksToCache(participantId, invitationsForParticipant);
        }

        private async Task WriteParticipantToInvitationLinksToCache(Guid participantId, IEnumerable<Guid> invitationIds)
        {
            var serialisedConference = JsonConvert.SerializeObject(invitationIds, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedConference);
            await _distributedCache.SetAsync(participantId.ToString(), data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(4)
                });
        }

        private async Task<List<Guid>> ReadParticipantToInvitationLinksFromCache(Guid participantId)
        {
            try
            {
                var data = await _distributedCache.GetAsync(participantId.ToString());
                if (data == null)
                    return null;
                
                var profileSerialised = Encoding.UTF8.GetString(data);
                var invitations = JsonConvert.DeserializeObject<IEnumerable<Guid>>(profileSerialised,
                        CachingHelper.SerializerSettings);
                return invitations?.ToList();
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
