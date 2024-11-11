#nullable enable
using System;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching;

public interface  IConferenceVideoControlStatusCache
{
    Task WriteToCache(Guid conferenceId, ConferenceVideoControlStatuses? layout, CancellationToken cancellationToken = default);
    Task<ConferenceVideoControlStatuses?> ReadFromCache(Guid conferenceId, CancellationToken cancellationToken = default);
}
