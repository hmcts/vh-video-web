using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V1.Helper;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
namespace VideoWeb.Extensions
{
    public static class ConferenceForVhOfficerResponseExtensions
    {
        public static IEnumerable<ConferenceForVhOfficerResponse> ApplyCsoFilter(this IEnumerable<ConferenceForVhOfficerResponse> conferences, VhoConferenceFilterQuery query)
        {
            var isQueryingByCso = query.AllocatedCsoIds.Any() || query.IncludeUnallocated;
            if (!isQueryingByCso)
                return conferences;

            IEnumerable<ConferenceForVhOfficerResponse> filteredConferences;
        
            if (!query.AllocatedCsoIds.Any() && query.IncludeUnallocated)
                filteredConferences = conferences.Where(UnallocatedFilterPredicate());
            else
                filteredConferences = conferences
                    .Where(r => (r.AllocatedCsoId.HasValue && query.AllocatedCsoIds.Contains(r.AllocatedCsoId.Value)) || !query.AllocatedCsoIds.Any())
                    .Union(query.IncludeUnallocated ? conferences.Where(UnallocatedFilterPredicate()) : Array.Empty<ConferenceForVhOfficerResponse>());

            return filteredConferences;
        }

        private static Func<ConferenceForVhOfficerResponse, bool> UnallocatedFilterPredicate() => 
            conference =>
            conference.AllocatedCsoId == null &&
            conference.CaseType != "Generic" &&
            HearingAllocationExcludedVenueList.ExcludedHearingVenueNames.All(venueName => venueName != conference.HearingVenueName);
        
    }
}
