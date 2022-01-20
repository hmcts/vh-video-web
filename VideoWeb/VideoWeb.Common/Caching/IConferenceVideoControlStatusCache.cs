using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface  IConferenceVideoControlStatusCache
    {
        Task WriteToCache(Guid conferenceId, ConferenceVideoControlStatuses? layout);
        Task<ConferenceVideoControlStatuses?> ReadFromCache(Guid conferenceId);
    }
}
