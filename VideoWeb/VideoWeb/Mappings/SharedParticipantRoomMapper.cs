using System;
using System.Linq;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class
        SharedParticipantRoomMapper : IMapTo<SharedParticipantRoomResponse, Participant, bool, SharedParticipantRoom>
    {
        public SharedParticipantRoom Map(SharedParticipantRoomResponse sharedRoom, Participant participant,
            bool isWitness)
        {
            var node = sharedRoom.PexipNode.Replace("https://", string.Empty);
            var tilePosition = int.Parse(new string(sharedRoom.Label.Where(char.IsDigit).ToArray()));
            var randomNumber = GetRandomNumberAsString();
            var tilePrefix = isWitness ? "W" : "T";
            var tilePrefixNumber = sharedRoom.Label.StartsWith("PanelMember") ? 400 : 200;
            var tileDisplayName =
                $"{tilePrefix}{tilePrefixNumber + tilePosition}{randomNumber};{participant.DisplayName};{participant.Id}";
            return new SharedParticipantRoom
            {
                PexipNode = node,
                ParticipantJoinUri = sharedRoom.ParticipantJoinUri,
                DisplayName = sharedRoom.Label,
                TileDisplayName = tileDisplayName
            };
        }

        private string GetRandomNumberAsString()
        {
            var ticksString = DateTime.UtcNow.Ticks.ToString();
            return string.Concat(ticksString.Reverse().Skip(1).Take(10));
        }
    }
}
