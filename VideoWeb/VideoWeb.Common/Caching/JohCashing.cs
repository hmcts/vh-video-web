using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public class JohCashing 
    {
        private readonly IMemoryCache _memoryCache;
        
        public JohCashing(IMemoryCache memoryCache) 
        {
            _memoryCache = memoryCache;
        }
        /*
        public Task<bool> GetJohEntry(Guid conferenceID)
        {
           var res=  _memoryCache.Get(conferenceID.ToString() + "-JohConsultionRoom");
            // if res has val 
            // return false . 
            return false;
        }*/

        public Task AddJohAsync(Conference conference)
        {
            throw new NotImplementedException();
        }
        /*
        public async  Task AddJohAsync(Guid conferenceID)
        {
            await _memoryCache.Set<>(conferenceID.ToString()+"-JohConsultionRoom" ,  null);
           await _memoryCache.GetOrCreateAsync(conferenceID.ToString()+"-JohConsultionRoom", entry =>
           {
               entry.SlidingExpiration = TimeSpan.FromHours(4);
               return Task.FromResult(conferenceID);
           });
        }*/
    }
}
