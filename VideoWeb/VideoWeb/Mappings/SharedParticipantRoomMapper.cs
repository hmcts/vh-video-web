using System;
using System.Linq;
using VideoApi.Contract.Responses;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class SharedParticipantRoomMapper : IMapTo<SharedParticipantRoomResponse, Guid, bool, SharedParticipantRoom>
    {
        public SharedParticipantRoom Map(SharedParticipantRoomResponse input, Guid participantId, bool isWitness)
        {
            var node = input.PexipNode.Replace("https://", string.Empty);
            var tilePosition = int.Parse(new string(input.Label.Where(char.IsDigit).ToArray()));
            var tilePrefix = isWitness ? "W" : "T";
            var tileDisplayName = $"{tilePrefix}{200+tilePosition};{input.Label};{participantId}";
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
