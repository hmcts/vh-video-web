using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface IJohCache
    {
        Task<bool> GetJohEntry(Guid confrenceID);
        Task AddJohAsync(Conference conference);
    }
}
