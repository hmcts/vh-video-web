using System;
using System.Threading;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;

namespace VideoWeb.Common.Caching
{
    public interface IHearingLayoutCache
    {
        Task WriteToCache(Guid conferenceId, HearingLayout? layout, CancellationToken cancellationToken = default);
        Task<HearingLayout?> ReadFromCache(Guid conferenceId, CancellationToken cancellationToken = default);
    }
}
