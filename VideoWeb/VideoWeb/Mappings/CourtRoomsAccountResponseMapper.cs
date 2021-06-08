using System.Collections.Generic;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using UserApi.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class CourtRoomsAccountResponseMapper : IMapTo<IEnumerable<ConferenceForAdminResponse>, List<CourtRoomsAccountResponse>>
    {
        public List<CourtRoomsAccountResponse> Map(IEnumerable<ConferenceForAdminResponse> userResponses)
        {

            var accountList = userResponses
                .Select(x => x.Participants.FindAll(s => s.HearingRole == "Judge").First())
                .Select(s => new { firstName = s.FirstName, lastName = s.LastName }).Distinct()
                .GroupBy(x => x.firstName)
                .Select(s => new CourtRoomsAccountResponse(s.Key, s.Select(g => g.lastName).OrderBy(o => o).ToList()))
                .OrderBy(s => s.FirstName)
                .ToList();

            return accountList; 
        }
    }
}
