using System;
using System.Collections.Generic;

namespace VideoWeb.Contract.Request
{
    public class VhoConferenceFilterQuery
    {
        public List<string> HearingVenueNames { get; set; } = new();
        public List<Guid> AllocatedCsoIds { get; set; } = new();
        public bool? IncludeUnallocated { get; set; }
    }
}
