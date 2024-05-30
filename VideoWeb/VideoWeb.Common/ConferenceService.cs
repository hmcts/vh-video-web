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
    public IConferenceCache ConferenceCache { get; }
}

public class ConferenceService(
    IConferenceCache conferenceCache,
    IVideoApiClient videoApiClient,
    IBookingsApiClient bookingApiClient)
    : IConferenceService
{
    public IConferenceCache ConferenceCache { get; } = conferenceCache;
    
    public async Task<Conference> GetConference(Guid conferenceId)
    {
        var conference = await ConferenceCache.GetOrAddConferenceAsync(conferenceId, ConferenceDetailsCallback);
        return conference;
        
        async Task<(ConferenceDetailsResponse conferenceDetails, HearingDetailsResponseV2 hearingDetails)> ConferenceDetailsCallback()
        {
            var conferenceDetails = await videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            var hearingDetails = await bookingApiClient.GetHearingDetailsByIdV2Async(conferenceDetails.HearingId);
            return (conferenceDetails, hearingDetails);
        }
    }
    
}
