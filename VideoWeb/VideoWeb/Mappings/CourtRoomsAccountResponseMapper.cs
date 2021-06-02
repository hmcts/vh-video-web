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
            var accountLissst = userResponses
                .Select(x => x.Participants.FindAll(s => s.HearingRole == "Judge").First())
                .Select(s => new {firstName = s.FirstName, lastName = s.LastName})
                .GroupBy(x => new {x.firstName, x.lastName});

            var accountList = userResponses
                .Select(x => x.Participants.FindAll(s => s.HearingRole == "Judge").First())
                .Select(s => new { firstName = s.FirstName, lastName = s.LastName })
                .GroupBy(x => new { x.firstName, x.lastName } )
                .Select(s => new CourtRoomsAccountResponse(s.Key.firstName, s.Select(g => g.lastName).OrderBy(o => o).ToList()))
                .OrderBy(s => s.Venue)
                .ToList();

            return accountList;
        }
    }
}
