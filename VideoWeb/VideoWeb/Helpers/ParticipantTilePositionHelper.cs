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
            var tiledParticipants = participants.Where(x =>
                x.Role == Role.Individual || x.Role == Role.Representative).ToList();

            if (tiledParticipants.Count > 4)
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
            else
            {
                var partyGroups = tiledParticipants.GroupBy(x => x.CaseTypeGroup).ToList();
                foreach (var group in partyGroups)
                {
                    var pats = @group.ToList();
                    var position = partyGroups.IndexOf(@group) + 1;
                    foreach (var p in pats)
                    {
                        var participant = participants.Single(x => x.Id == p.Id);
                        participant.TiledDisplayName = GetTiledDisplayName(participant, position);
                        position += 2;
                    }
                }
            }
        }

        private static string GetTiledDisplayName(ParticipantResponse participant, int position)
        {
            return $"T{position};{participant.DisplayName};{participant.Id}";
        }
    }
}
