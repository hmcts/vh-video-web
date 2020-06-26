using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.User;

namespace VideoWeb.Mappings
{
    public static class CourtRoomsAccountResponseMapper
    {

        public static List<CourtRoomsAccountResponse> MapUserToCourtRoomsAccount(IEnumerable<UserResponse> userResponses, IEnumerable<string> userNames)
        {
            var accountList = userResponses
                .Where(x => userNames.Any(s => x.First_name == s))
                .Select(s => new { first_name = s.First_name, last_name = s.Last_name })
                .GroupBy(x => x.first_name)
                .Select(s => new CourtRoomsAccountResponse(s.Key, s.Select(g => g.last_name).OrderBy(o => o).ToList()))
                .OrderBy(s => s.Venue)
                .ToList();

            return accountList;
        }
    }
}
