using System;
using System.Linq;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class SharedParticipantRoomMapper : IMapTo<SharedParticipantRoomResponse, Participant, bool, SharedParticipantRoom>
    {
        public SharedParticipantRoom Map(SharedParticipantRoomResponse sharedRoom, Participant participant, bool isWitness)
        {
            var node = sharedRoom.PexipNode.Replace("https://", string.Empty);
            var tilePosition = int.Parse(new string(sharedRoom.Label.Where(char.IsDigit).ToArray()));
            var tilePrefix = isWitness ? "W" : "T";
            var tileDisplayName = $"{tilePrefix}{200+tilePosition};{participant.DisplayName};{participant.Id}";
            return new SharedParticipantRoom
            {
                PexipNode = node,
                ParticipantJoinUri = sharedRoom.ParticipantJoinUri,
                DisplayName = sharedRoom.Label,
                TileDisplayName = tileDisplayName
            };
        }
    }
}
