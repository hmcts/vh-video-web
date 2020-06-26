using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class CourtRoomsAccountResponse
    {
        public CourtRoomsAccountResponse(string Venue, List<string> CourtRooms)
        {
            this.Venue = Venue;
            this.CourtRooms = CourtRooms ?? new List<string>();
        }

        /// <summary>
        /// The venue name (judge first name)
        /// </summary>
        public string Venue { get; set; }

        /// <summary>
        /// The list of court rooms (judge last name)
        /// </summary>
        public List<string> CourtRooms { get; set; }
    }
}
