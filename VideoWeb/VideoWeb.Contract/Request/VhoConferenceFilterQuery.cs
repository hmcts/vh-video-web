using System.Collections.Generic;

namespace VideoWeb.Contract.Request
{
    public class VhoConferenceFilterQuery
    {
        public IEnumerable<string> VenueNames { get; set; }
    }
}
