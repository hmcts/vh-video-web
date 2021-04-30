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

        public Task<IEnumerable<ConsultationInvitation>> GetInvitationsForParticipant(Guid participantId)
        {
            throw new NotImplementedException();
        }
        
        private Task SetResponsesForRoom(long roomId, List<Guid> acceptedResponses)
        {
            var serialisedConference = JsonConvert.SerializeObject(acceptedResponses, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedConference);
            return _distributedCache.SetAsync(roomId.ToString(), data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(4)
                });
        }


        private async Task<List<Guid>> GetAcceptedResponsesFromCache(string key)
        {
            try
            {
                var data = await _distributedCache.GetAsync(key);
                var profileSerialised = Encoding.UTF8.GetString(data);
                var profile =
                    JsonConvert.DeserializeObject<List<Guid>>(profileSerialised, CachingHelper.SerializerSettings);
                return profile;
            }
            catch (Exception)
            {
                return new List<Guid>();
            }
        }
    }
}

/*
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using UserApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public class DistributedConsultationResponseCache : IConsultationResponseCache
    {
        private readonly IDistributedCache _distributedCache;

        public DistributedConsultationResponseCache(IDistributedCache distributedCache)
        {
            _distributedCache = distributedCache;
        }

        public Task AddOrUpdateResponses(long roomId, List<Guid> accepted)
        {
            return SetResponsesForRoom(roomId, accepted);
        }

        public Task ClearResponses(long roomId)
        {
            return SetResponsesForRoom(roomId, new List<Guid>());
        }

        public Task<List<Guid>> GetResponses(long roomId)
        {
            return GetAcceptedResponsesFromCache(roomId.ToString());
        }

        private Task SetResponsesForRoom(long roomId, List<Guid> acceptedResponses)
        {
            var serialisedConference = JsonConvert.SerializeObject(acceptedResponses, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedConference);
            return _distributedCache.SetAsync(roomId.ToString(), data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(4)
                });
        }


        private async Task<List<Guid>> GetAcceptedResponsesFromCache(string key)
        {
            try
            {
                var data = await _distributedCache.GetAsync(key);
                var profileSerialised = Encoding.UTF8.GetString(data);
                var profile =
                    JsonConvert.DeserializeObject<List<Guid>>(profileSerialised, CachingHelper.SerializerSettings);
                return profile;
            }
            catch (Exception)
            {
                return new List<Guid>();
            }
        }
    }
}

*/
