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
            var heartbeatMode = "NO_HEARTBEAT";
            if (participant.Role == Role.Judge)
            {
                prefix = "JUDGE";
                heartbeatMode = "HEARTBEAT";
            }
            else if (participant.HearingRole.ToLower().Trim() == "witness")
            {
                prefix = "WITNESS";
            }
            else if (participant.Role != Role.VideoHearingsOfficer)
            {
                prefix = "CIVILIAN";
            }

            return $"{prefix};{heartbeatMode};{participant.DisplayName};{participant.Id}";
        }
    }
}
