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
    public Task RemoveConference(Conference conference, CancellationToken cancellationToken = default);
    public Task PopulateConferenceCacheForToday(CancellationToken cancellationToken = default);
}

public class ConferenceService(
    IConferenceCache conferenceCache,
    IVideoApiClient videoApiClient,
    IBookingsApiClient bookingApiClient)
    : IConferenceService
{
    
    /// <summary>
    /// Will return conference from cache if exists, otherwise will query database and update cache
    /// </summary>
    /// <param name="conferenceId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    public async Task<Conference> GetConference(Guid conferenceId, CancellationToken cancellationToken = default)
    {
        return await conferenceCache.GetOrAddConferenceAsync(conferenceId, ConferenceDetailsCallback, cancellationToken);
        
        async Task<(ConferenceDetailsResponse conferenceDetails, HearingDetailsResponseV2 hearingDetails)> ConferenceDetailsCallback()
        {
            var conferenceDetails = await videoApiClient.GetConferenceDetailsByIdAsync(conferenceId, cancellationToken);
            var hearingDetails = await bookingApiClient.GetHearingDetailsByIdV2Async(conferenceDetails.HearingId, cancellationToken);
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
        var conferenceDetails = await videoApiClient.GetConferenceDetailsByIdAsync(conferenceId, cancellationToken);
        var hearingDetails = await bookingApiClient.GetHearingDetailsByIdV2Async(conferenceDetails.HearingId, cancellationToken);
        await conferenceCache.AddConferenceAsync(conferenceDetails, hearingDetails, cancellationToken);
        return await GetConference(conferenceId, cancellationToken);
    }

    public async Task UpdateConferenceAsync(Conference conference, CancellationToken cancellationToken = default)
    {
        await conferenceCache.UpdateConferenceAsync(conference, cancellationToken);
    }
    
    public async Task<IEnumerable<Conference>> GetConferences(IEnumerable<Guid> conferenceIds, CancellationToken cancellationToken = default)
    {
        return await Task.WhenAll(conferenceIds.Select(id => GetConference(id, cancellationToken)));
    }
    
    public async Task RemoveConference(Conference conference, CancellationToken cancellationToken = default)
    {
        await conferenceCache.RemoveConferenceAsync(conference, cancellationToken);
    }
    
    public async Task PopulateConferenceCacheForToday(CancellationToken cancellationToken = default)
    {
        var hearings = await bookingApiClient.GetHearingsForTodayV2Async(cancellationToken);
        var conferences = await videoApiClient.GetConferencesTodayAsync(null, cancellationToken);
        var hearingConferences = conferences
            .SelectMany(c => hearings.Where(h => h.Id == c.HearingId)
                .Select(h => (c, h)));
        foreach (var (conference, hearing) in hearingConferences)
        {
            await conferenceCache.AddConferenceAsync(conference, hearing, cancellationToken);
        }
    }
}
