using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class ParticipantForUserResponseMapper
    {
        public static List<ParticipantForUserResponse> MapParticipants(IEnumerable<ParticipantSummaryResponse> participants)
        {
            var mappedParticipants = participants.Select(participant => new ParticipantForUserResponse
                {
                    Id = participant.Id,
                    Username = participant.Username,
                    DisplayName = participant.Display_name,
                    Status = Enum.Parse<ParticipantStatus>(participant.Status.ToString()),
                    Role = Enum.Parse<Role>(participant.User_role.ToString()),
                    Representee = string.IsNullOrWhiteSpace(participant.Representee) ? null : participant.Representee,
                    CaseTypeGroup = participant.Case_group,
                    FirstName = participant.First_name,
                    LastName = participant.Last_name,
                })
                .ToList();

            AssignTilePositions(mappedParticipants);
            
            return mappedParticipants;
        }
        
        private static void AssignTilePositions(List<ParticipantForUserResponse> participants)
        {
            var judge = participants.SingleOrDefault(x => x.Role == Role.Judge);
            if (judge != null)
            {
                judge.PexipDisplayName = $"T{0};{judge.DisplayName};{judge.Id}";
            }
            var tiledParticipants = participants.Where(x =>
                x.Role == Role.Individual || x.Role == Role.Representative).ToList();

            var partyGroups = tiledParticipants.GroupBy(x => x.CaseTypeGroup).ToList();
            foreach (var group in partyGroups)
            {
                var pats = @group.ToList();
                var position = partyGroups.IndexOf(@group) + 1;
                foreach (var p in pats)
                {
                    var participant = participants.Single(x => x.Id == p.Id);
                    participant.PexipDisplayName = $"T{position};{participant.DisplayName};{participant.Id}";
                    position += 2;
                }
            }
        }
    }
}
