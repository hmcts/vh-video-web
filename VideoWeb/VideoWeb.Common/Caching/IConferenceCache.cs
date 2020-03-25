using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.Common.Caching
{
    public interface IConferenceCache
    {
        Task AddConferenceToCache(ConferenceDetailsResponse conferenceResponse);
        Conference GetConference(Guid id);
    }
}
