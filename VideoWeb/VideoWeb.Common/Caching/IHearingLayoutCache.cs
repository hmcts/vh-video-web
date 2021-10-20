using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;

namespace VideoWeb.Common.Caching
{
    public interface IHearingLayoutCache
    {
        Task WriteToCache(Guid conferenceId, HearingLayout? layout);
        Task<HearingLayout?> ReadFromCache(Guid conferenceId);
    }
}
