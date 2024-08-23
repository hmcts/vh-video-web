using System;
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
}

public class ConferenceService(
    IConferenceCache conferenceCache,
    IVideoApiClient videoApiClient,
    IBookingsApiClient bookingApiClient)
    : IConferenceService
{
    public async Task<Conference> GetConference(Guid conferenceId, CancellationToken cancellationToken = default)
    {
        var conference = await conferenceCache.GetOrAddConferenceAsync(conferenceId, ConferenceDetailsCallback, cancellationToken);
        return conference;
        
        async Task<(ConferenceDetailsResponse conferenceDetails, HearingDetailsResponseV2 hearingDetails)> ConferenceDetailsCallback()
        {
            var conferenceDetails = await videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            var hearingDetails = await bookingApiClient.GetHearingDetailsByIdV2Async(conferenceDetails.HearingId);
            return (conferenceDetails, hearingDetails);
        }
    }
    
    /// <summary>
    /// Force query of database and update cache
    /// </summary>
    /// <param name="conferenceId"></param>
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
}
