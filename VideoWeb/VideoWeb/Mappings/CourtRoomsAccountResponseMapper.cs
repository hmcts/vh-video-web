using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class CourtRoomsAccountResponseMapper : IMapTo<IEnumerable<ConferenceForVhOfficerResponse>, List<CourtRoomsAccountResponse>>
    {
        public List<CourtRoomsAccountResponse> Map(IEnumerable<ConferenceForVhOfficerResponse> conferenceForVho)
        {
            var venuesAndJudges = conferenceForVho
                .Where(e => e.Participants.Exists(s => s.Role == Role.Judge))
                .Select(e => new
                {
                    venue = e.HearingVenueName,
                    judge = e.Participants.Single(s => s.Role == Role.Judge).DisplayName
                })
                .GroupBy(e => e.venue)
                .ToList();
               
           var accountList = venuesAndJudges
               .Select(s => new CourtRoomsAccountResponse(s.Key, 
                   s.Select(g => g.judge).OrderBy(o => o).ToList()))
               .OrderBy(s => s.Venue)
               .ToList();

            return accountList; 
        }
    }
}
