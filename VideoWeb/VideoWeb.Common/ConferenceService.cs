using System;
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
}

public class ConferenceService(
    IConferenceCache conferenceCache,
    IVideoApiClient videoApiClient,
    IBookingsApiClient bookingApiClient)
    : IConferenceService
{
    public async Task<Conference> GetConference(Guid conferenceId)
    {
        var conference = await conferenceCache.GetOrAddConferenceAsync(conferenceId, ConferenceDetailsCallback);
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
