using System;
using System.Collections.Generic;
using System.Linq;
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
    public Task<Conference> GetConference(Guid conferenceId);
    public Task<Conference> ForceGetConference(Guid conferenceId);
    public Task UpdateConferenceAsync(Conference conference);
    public Task<IEnumerable<Conference>> GetConferences(IEnumerable<Guid> conferenceIds);
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
    /// <returns></returns>
    public async Task<Conference> GetConference(Guid conferenceId)
    {
        return await conferenceCache.GetOrAddConferenceAsync(conferenceId, ConferenceDetailsCallback);
        
        async Task<(ConferenceDetailsResponse conferenceDetails, HearingDetailsResponseV2 hearingDetails)> ConferenceDetailsCallback()
        {
            var conferenceDetails = await videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            var hearingDetails = await bookingApiClient.GetHearingDetailsByIdV2Async(conferenceDetails.HearingId);
            return (conferenceDetails, hearingDetails);
        }
    }
    
    public async Task<IEnumerable<Conference>> GetConferences(IEnumerable<Guid> conferenceIds)
    {
        var ids = conferenceIds.ToArray();
        return await Task.WhenAll(ids.Select(GetConference));
    }
    
    /// <summary>
    /// Force query of database and update cache
    /// </summary>
    /// <param name="conferenceId"></param>
    /// <returns></returns>
    public async Task<Conference> ForceGetConference(Guid conferenceId)
    {
        var conferenceDetails = await videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
        var hearingDetails = await bookingApiClient.GetHearingDetailsByIdV2Async(conferenceDetails.HearingId);
        await conferenceCache.AddConferenceAsync(conferenceDetails, hearingDetails);
        return await GetConference(conferenceId);
    }

    public async Task UpdateConferenceAsync(Conference conference)
    {
        await conferenceCache.UpdateConferenceAsync(conference);
    }
}
