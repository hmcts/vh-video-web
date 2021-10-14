using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;

namespace VideoWeb.Common.Caching
{
    public interface IHearingLayoutCache
    {
        Task Write(Guid conferenceId, HearingLayout layout);
        Task<HearingLayout?> Read(Guid conferenceId);
    }
}
