using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class CourtRoomsAccountResponse(string venue, List<string> rooms)
    {
        /// <summary>
        /// The venue name (judge first name)
        /// </summary>
        public string Venue { get; set; } = venue;
        
        /// <summary>
        /// The list of court rooms (judge last name)
        /// </summary>
        public List<string> Rooms { get; set; } = rooms ?? new List<string>();
    }
}
