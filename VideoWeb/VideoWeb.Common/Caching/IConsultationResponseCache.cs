using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VideoWeb.Common.Caching
{
    public interface IConsultationResponseCache
    {
        Task AddOrUpdateResponses(long roomId, List<Guid> accepted);
        Task ClearResponses(long roomId);
        Task<List<Guid>> GetResponses(long roomId);
    }
}
