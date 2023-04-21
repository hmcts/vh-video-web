using System;
using System.Collections.Generic;

namespace VideoWeb.Contract.Request
{
    public class VhoConferenceFilterQuery
    {
        public IEnumerable<string> HearingVenueNames { get; set; } = new List<string>();
        public IEnumerable<Guid> AllocatedCsoIds { get; set; } = new List<Guid>();
        public bool IncludeUnallocated { get; set; }
    }
}
