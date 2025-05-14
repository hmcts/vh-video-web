using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Helpers
{
    public static class ParticipantTilePositionHelper
    {
        public const string Heartbeat = "HEARTBEAT";
        public const string NoHeartbeat = "NO_HEARTBEAT";

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
            var heartbeatMode = NoHeartbeat;
            var hearingRole = participant.HearingRole?.ToLower().Trim();
            if (participant.Role == Role.Judge)
            {
                prefix = "JUDGE";
                heartbeatMode = Heartbeat;
            } 
            else if (participant.Role == Role.StaffMember)
            {
                prefix = "CLERK";
                heartbeatMode = Heartbeat;
            }
            else if (hearingRole == "witness" || hearingRole == "expert" ||
                     participant.Role == Role.QuickLinkObserver || participant.Role == Role.QuickLinkParticipant)
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
