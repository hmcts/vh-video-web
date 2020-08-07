using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class TilePositionMapper
    {
        public static void AssignTilePositions(ConferenceDetailsResponse conference, ConferenceResponseVho response)
        {
            var tiledParticipants = conference.Participants.Where(x =>
                x.User_role == UserRole.Individual || x.User_role == UserRole.Representative).ToList();

            var partyGroups = tiledParticipants.GroupBy(x => x.Case_type_group).ToList();
            foreach (var group in partyGroups)
            {
                var pats = @group.ToList();
                var position = partyGroups.IndexOf(@group) + 1;
                foreach (var p in pats)
                {
                    var participant = response.Participants.Find(x => x.Id == p.Id);
                    participant.TiledDisplayName = $"T{position};{participant.DisplayName};{participant.Id}";
                    position += 2;
                }
            }
        }
    }
}
