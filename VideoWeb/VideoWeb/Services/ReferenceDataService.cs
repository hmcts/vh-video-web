using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.Services;

public interface IReferenceDataService
{
    Task InitialiseCache();
    Task<List<InterpreterLanguage>> GetInterpreterLanguagesAsync(CancellationToken cancellationToken = default);
    Task<List<HearingVenueResponse>> GetHearingVenuesForTodayAsync(CancellationToken cancellationToken = default);
    
}

public class ReferenceDataService(IBookingsApiClient bookingsApiClient, IMemoryCache memoryCache): IReferenceDataService
{
    private readonly string _interpreterLanguagesKey = "RefData_InterpreterLanguages";

    public async Task InitialiseCache()
    {
        await GetInterpreterLanguagesAsync();
        await GetHearingVenuesForTodayAsync();
    }
    public async Task<List<InterpreterLanguage>> GetInterpreterLanguagesAsync(CancellationToken cancellationToken = default)
    {
        return await memoryCache.GetOrCreateAsync(_interpreterLanguagesKey, async entry =>
        {
            entry.AbsoluteExpiration = DateTimeOffset.UtcNow.AddHours(3);
            var interpreterLanguages = await bookingsApiClient.GetAvailableInterpreterLanguagesAsync(cancellationToken);
            var languages = interpreterLanguages.Select(x=> x.Map()).ToList();
            return languages;
        });
    }

    public async Task<List<HearingVenueResponse>> GetHearingVenuesForTodayAsync(CancellationToken cancellationToken = default)
    {
        return await memoryCache.GetOrCreateAsync("RefData_HearingVenues", async entry =>
        {
            entry.AbsoluteExpiration = DateTimeOffset.UtcNow.AddHours(3);
            var hearingVenues = await bookingsApiClient.GetHearingVenuesForHearingsTodayAsync(cancellationToken);
            return hearingVenues.ToList();
        });
    }
}
