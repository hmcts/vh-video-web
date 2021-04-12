using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Helpers
{
    public static class ParticipantTilePositionHelper
    {
        public static void AssignTilePositions(IEnumerable<ParticipantResponse> participants)
        {
            foreach (var participant in participants)
            {
                if (participant.Role == Role.Judge)
                {
                    participant.TiledDisplayName = GetTiledDisplayName(participant, "JUDGE");
                }
                else if (participant.HearingRole.ToLower().Trim() == "witness")
                {
                    participant.TiledDisplayName = GetTiledDisplayName(participant, "WITNESS");
                }
                else if (participant.Role != Role.VideoHearingsOfficer)
                {
                    participant.TiledDisplayName = GetTiledDisplayName(participant, "CIVILIAN");
                }
            }        
        }

        private static string GetTiledDisplayName(ParticipantResponse participant, string prefix)
        {
            return $"{prefix};{participant.DisplayName};{participant.Id}";
        }
    }
}
