using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;

namespace VideoWeb.Mappings;

public static class ParticipantDtoForResponseMapper
{
    public static ParticipantResponse Map(Participant participant)
    {
        var response = new ParticipantResponse();
        response.DisplayName = participant.DisplayName;
        response.FirstName = participant.FirstName;
        response.HearingRole = participant.HearingRole;
        response.Id = participant.Id;
        response.LastName = participant.LastName;
        response.Name = participant.FullTitledName;
        response.Representee = participant.Representee;
        response.Role = participant.Role;
        response.Status = participant.ParticipantStatus;
        response.LinkedParticipants = participant.LinkedParticipants?.Select(e => new LinkedParticipantResponse { LinkedId = e.LinkedId, LinkType = e.LinkType }).ToList();
        response.UserName = participant.Username;
        response.TiledDisplayName = ParticipantTilePositionHelper.GetTiledDisplayName(response);
        response.CurrentRoom = RoomSummaryResponseMapper.Map(participant.CurrentRoom);
        response.InterpreterRoom  = RoomSummaryResponseMapper.Map(participant.InterpreterRoom);
        response.InterpreterLanguage = participant.InterpreterLanguage?.Map();
        response.ExternalReferenceId = participant.ExternalReferenceId;
        response.ProtectFrom = participant.ProtectFrom;
        return response;
    }
}
