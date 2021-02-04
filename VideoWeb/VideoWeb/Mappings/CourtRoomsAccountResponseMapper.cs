using System.Collections.Generic;
using System.Linq;
using UserApi.Contract.Responses;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class CourtRoomsAccountResponseMapper : IMapTo<IEnumerable<UserResponse>, IEnumerable<string>, List<CourtRoomsAccountResponse>>
    {
        public List<CourtRoomsAccountResponse> Map(IEnumerable<UserResponse> userResponses, IEnumerable<string> userNames)
        {
            var accountList = userResponses
                .Where(x => userNames.Any(s => x.FirstName == s))
                .Select(s => new { firstName = s.FirstName, lastName = s.LastName })
                .GroupBy(x => x.firstName)
                .Select(s => new CourtRoomsAccountResponse(s.Key, s.Select(g => g.lastName).OrderBy(o => o).ToList()))
                .OrderBy(s => s.Venue)
                .ToList();

            return accountList;
        }
    }
}
