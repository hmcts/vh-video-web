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

public class ReferenceDataService(IBookingsApiClient bookingsApiClient, IMemoryCache memoryCache)
    : IReferenceDataService
{
    private const string InterpreterLanguagesKey = "RefData_InterpreterLanguages";
    private const string HearingVenuesKey = "RefData_HearingVenues";

    public async Task InitialiseCache()
    {
        await GetInterpreterLanguagesAsync();
        await GetHearingVenuesForTodayAsync();
    }
    public async Task<List<InterpreterLanguage>> GetInterpreterLanguagesAsync(
        CancellationToken cancellationToken = default)
    {
        return await GetOrCreateCacheAsync(InterpreterLanguagesKey, async token =>
        {
            var interpreterLanguages = await bookingsApiClient.GetAvailableInterpreterLanguagesAsync(token);
            return interpreterLanguages.Select(x => x.Map()).ToList();
        }, cancellationToken);
    }

    public async Task<List<HearingVenueResponse>> GetHearingVenuesForTodayAsync(
        CancellationToken cancellationToken = default)
    {
        return await GetOrCreateCacheAsync(HearingVenuesKey, async token =>
        {
            var hearingVenues = await bookingsApiClient.GetHearingVenuesForHearingsTodayAsync(token);
            return hearingVenues.ToList();
        }, cancellationToken);
    }

    private async Task<List<T>> GetOrCreateCacheAsync<T>(string cacheKey,
        Func<CancellationToken, Task<List<T>>> fetchFunction, CancellationToken cancellationToken)
    {
        return await memoryCache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpiration = DateTimeOffset.UtcNow.AddHours(3);
            return await fetchFunction(cancellationToken);
        });
    }
}
