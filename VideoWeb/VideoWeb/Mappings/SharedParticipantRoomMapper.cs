using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;

namespace VideoWeb.Mappings;

public static class SharedParticipantRoomMapper
{
    public static SharedParticipantRoom Map(SharedParticipantRoomResponse sharedRoom, Participant participant,
        bool isWitness)
    {
        var node = sharedRoom.PexipNode.Replace("https://", string.Empty);
        var tilePrefix = isWitness ? "WITNESS" : "CIVILIAN";
        var tileDisplayName =
            $"{tilePrefix};{ParticipantTilePositionHelper.NoHeartbeat};{participant.DisplayName};{participant.Id}";
        return new SharedParticipantRoom
        {
            PexipNode = node,
            ParticipantJoinUri = sharedRoom.ParticipantJoinUri,
            DisplayName = sharedRoom.Label,
            TileDisplayName = tileDisplayName
        };
    }
}
