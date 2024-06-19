using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class CourtRoomsAccountResponse(string venue, List<string> judges)
    {
        /// <summary>
        /// The venue name (judge first name)
        /// </summary>
        public string VenueName { get; set; } = venue;
        
        /// <summary>
        /// The list of court rooms (judge last name)
        /// </summary>
        public List<string> Judges { get; set; } = judges ?? new List<string>();
    }
}
