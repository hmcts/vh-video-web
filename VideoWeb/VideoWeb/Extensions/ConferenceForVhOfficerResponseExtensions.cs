using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;

namespace VideoWeb.Extensions;

public static class ConferenceForVhOfficerResponseExtensions
{
    private static readonly IReadOnlyList<string> ExcludedHearingVenueNames = new List<string> (HearingScottishVenueNames.ScottishHearingVenuesList)
    {
        "Teesside Combined Court Centre",
        "Teesside Magistrates Court",
        "Middlesbrough County Court"
    };
    public static IEnumerable<ConferenceForVhOfficerResponse> ApplyCsoFilter(this IEnumerable<ConferenceForVhOfficerResponse> conferences, VhoConferenceFilterQuery query)
    {
        var isQueryingByCso = query.AllocatedCsoIds.Any() || query.IncludeUnallocated;
        if (!isQueryingByCso)
        {
            return conferences;
        }

        IEnumerable<ConferenceForVhOfficerResponse> filteredConferences;
        
        if (!query.AllocatedCsoIds.Any() && query.IncludeUnallocated)
        {
            filteredConferences = conferences
                .Where(r => r.AllocatedCsoId == null &&
                            ExcludedHearingVenueNames.All(venueName => venueName != r.HearingVenueName));
        }
        else
        {
            filteredConferences = conferences
                .Where(r => (r.AllocatedCsoId.HasValue && query.AllocatedCsoIds.Contains(r.AllocatedCsoId.Value)) || !query.AllocatedCsoIds.Any())
                .Union(conferences.Where(r => r.AllocatedCsoId == null && query.IncludeUnallocated));
        }

        return filteredConferences;
    }
}
