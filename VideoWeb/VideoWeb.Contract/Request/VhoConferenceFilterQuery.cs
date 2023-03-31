using System;
using System.Collections.Generic;

namespace VideoWeb.Contract.Request
{
    public class VhoConferenceFilterQuery
    {
        public IEnumerable<string> HearingVenueNames { get; set; }
        public IList<Guid> AllocatedCsoIds { get; set; } = new List<Guid>();
        public bool IncludeUnallocated { get; set; }
    }
}
