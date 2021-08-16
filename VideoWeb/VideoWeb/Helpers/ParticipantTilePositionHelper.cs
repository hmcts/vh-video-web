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
                participant.TiledDisplayName = GetTiledDisplayName(participant);
            }
        }

        public static string GetTiledDisplayName(ParticipantResponse participant)
        {
            var prefix = "";
            if (participant.Role == Role.Judge)
            {
                prefix = "JUDGE";
            }
            else if (participant.HearingRole?.ToLower().Trim() == "witness" || participant.Role == Role.QuickLinkObserver || participant.Role == Role.QuickLinkParticipant)
            {
                prefix = "WITNESS";
            }
            else if (participant.Role != Role.VideoHearingsOfficer)
            {
                prefix = "CIVILIAN";
            }

            return $"{prefix};{participant.DisplayName};{participant.Id}";
        }
    }
}
