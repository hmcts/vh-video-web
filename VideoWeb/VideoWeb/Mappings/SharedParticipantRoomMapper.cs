using System;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class SharedParticipantRoomMapper : IMapTo<SharedParticipantRoomResponse, Guid, SharedParticipantRoom>
    {
        public SharedParticipantRoom Map(SharedParticipantRoomResponse input, Guid participantId)
        {
            var node = input.PexipNode.Replace("https://", string.Empty);
            var tilePosition = new String(input.Label.Where(char.IsDigit).ToArray());
            var tileDisplayName = $"I{tilePosition};{input.Label};{participantId}";
            return new SharedParticipantRoom
            {
                PexipNode = node,
                ParticipantJoinUri = input.ParticipantJoinUri,
                DisplayName = input.Label,
                TileDisplayName = tileDisplayName
            };
        }
    }
}
