using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings;

public class ParticipantInConferenceResponseMapper : IMapTo<Participant, ParticipantForUserResponse>
{
    public ParticipantForUserResponse Map(Participant participant)
    {
        var linkParticipantMapper = new LinkedParticipantToLinkedParticipantResponseMapper();
        
        var participantForUserResponse = new ParticipantForUserResponse()
        {
            FirstName = participant.FirstName,
            LastName = participant.LastName,
            Status = participant.ParticipantStatus,
            DisplayName = participant.DisplayName,
            Id = participant.Id,
            //Name = participant.,
            Role = participant.Role,
            HearingRole = participant.HearingRole,
            Representee = participant.Representee,
            //CurrentRoom = participant.,
            //InterpreterRoom = participant.,
            LinkedParticipants = participant.LinkedParticipants.Select(linkParticipantMapper.Map).ToList(),
            UserName = participant.Username,
            CaseTypeGroup = participant.CaseTypeGroup,
            //TiledDisplayName = participant.
        };
        
        return participantForUserResponse;
    }
}
