using System.Collections.Generic;

namespace VideoWeb.Contract.Request
{
    public class VhoConferenceFilterQuery
    {
        public IEnumerable<string> UserNames { get; set; }
    }
}
