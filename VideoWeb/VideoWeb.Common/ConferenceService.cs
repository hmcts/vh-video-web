using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.Common;

public interface IConferenceService
{
    public Task<Conference> GetConference(Guid conferenceId, CancellationToken cancellationToken = default);
    public Task<Conference> ForceGetConference(Guid conferenceId, CancellationToken cancellationToken = default);
    public Task UpdateConferenceAsync(Conference conference, CancellationToken cancellationToken = default);
    public Task<IEnumerable<Conference>> GetConferences(IEnumerable<Guid> conferenceIds, CancellationToken cancellationToken = default);
}

public class ConferenceService : IConferenceService
{
    private readonly IConferenceCache _conferenceCache;
    private readonly IVideoApiClient _videoApiClient;
    private readonly IBookingsApiClient _bookingsApiClient;
    
    public ConferenceService(IConferenceCache conferenceCache,
        IVideoApiClient videoApiClient,
        IBookingsApiClient bookingApiClient)
    {
        _conferenceCache = conferenceCache;
        _videoApiClient = videoApiClient;
        _bookingsApiClient = bookingApiClient;
    }
    
    /// <summary>
    /// Will return conference from cache if exists, otherwise will query database and update cache
    /// </summary>
    /// <param name="conferenceId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<Conference> GetConference(Guid conferenceId, CancellationToken cancellationToken = default)
    {
        return await _conferenceCache.GetOrAddConferenceAsync(conferenceId, ConferenceDetailsCallback, cancellationToken);
        
        async Task<(ConferenceDetailsResponse conferenceDetails, HearingDetailsResponseV2 hearingDetails)> ConferenceDetailsCallback()
        {
            var conferenceDetails = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId, cancellationToken);
            var hearingDetails = await _bookingsApiClient.GetHearingDetailsByIdV2Async(conferenceDetails.HearingId, cancellationToken);
            return (conferenceDetails, hearingDetails);
        }
    }
    
    /// <summary>
    /// Force query of database and update cache
    /// </summary>
    /// <param name="conferenceId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<Conference> ForceGetConference(Guid conferenceId, CancellationToken cancellationToken = default)
    {
        var conferenceDetails = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId, cancellationToken);
        var hearingDetails = await _bookingsApiClient.GetHearingDetailsByIdV2Async(conferenceDetails.HearingId, cancellationToken);
        await _conferenceCache.AddConferenceAsync(conferenceDetails, hearingDetails, cancellationToken);
        return await GetConference(conferenceId, cancellationToken);
    }

    public async Task UpdateConferenceAsync(Conference conference, CancellationToken cancellationToken = default)
    {
        await _conferenceCache.UpdateConferenceAsync(conference, cancellationToken);
    }
    
    public async Task<IEnumerable<Conference>> GetConferences(IEnumerable<Guid> conferenceIds, CancellationToken cancellationToken = default)
    {
        var ids = conferenceIds.ToArray();
        return await Task.WhenAll(ids.Select(id => GetConference(id, cancellationToken)));
    }
}
