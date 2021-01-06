using System;
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
            var judge = participants.SingleOrDefault(x => x.Role == Role.Judge);
            if (judge != null)
            {
                judge.TiledDisplayName = $"T{0};{judge.DisplayName};{judge.Id}";
            }
            var tiledParticipants = GetNotJudgeParticipant(participants);

            if (tiledParticipants.Count > 4)
            {
                TiledParticipantGreaterThanFour(participants);
            }
            else
            {
                TiledParticipants(tiledParticipants);
            }
        }

        private static string GetTiledDisplayName(ParticipantResponse participant, int position)
        {
            var prefix = participant.HearingRole.ToLower().Trim() == "witness" ? "W" : "T";
            return $"{prefix}{position};{participant.DisplayName};{participant.Id}";
        }

        private static void TiledParticipantGreaterThanFour(IEnumerable<ParticipantResponse> participants)
        {
            // If the number of participants is more than 4, then simply increment the tile numbers
            var position = 1;
            foreach (var participant in participants)
            {
                if (participant.Role == Role.Judge)
                {
                    participant.TiledDisplayName = GetTiledDisplayName(participant, 0);
                }
                else
                {
                    participant.TiledDisplayName = GetTiledDisplayName(participant, position);
                    position++;
                }
            }
        }


        private static void TiledParticipants(List<ParticipantResponse> tiledParticipants)
        {
            var partyGroups = tiledParticipants.GroupBy(x => x.CaseTypeGroup).ToList();
            foreach (var group in partyGroups)
            {
                var pats = group.ToList();
                var position = partyGroups.IndexOf(group) + 1;
                foreach (var p in pats)
                {
                    var participant = tiledParticipants.Find(x => x.Id == p.Id);
                    participant.TiledDisplayName = GetTiledDisplayName(participant, position);
                    position += 2;
                }
            }
        }

        private static List<ParticipantResponse> GetNotJudgeParticipant(IEnumerable<ParticipantResponse> participants)
        {
            return participants.Where(x =>
            x.Role == Role.Individual || x.Role == Role.Representative || x.Role == Role.JudicialOfficeHolder).ToList();

        }
    }
}
