using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class CourtRoomsAccountResponse
    {
        public CourtRoomsAccountResponse(string firstName, List<string> LastNames)
        {
            this.FirstName = firstName;
            this.LastNames = LastNames ?? new List<string>();
        }

        /// <summary>
        /// The venue name (judge first name)
        /// </summary>
        public string FirstName { get; set; }

        /// <summary>
        /// The list of court rooms (judge last name)
        /// </summary>
        public List<string> LastNames { get; set; }
    }
}
