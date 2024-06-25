using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings;

public class ParticipantDtoForUserResponseMapper : IMapTo<IEnumerable<Participant>, List<ParticipantForUserResponse>>
{
    public List<ParticipantForUserResponse> Map(IEnumerable<Participant> participants)
    {
        var mappedParticipants = participants.Select(participant => new ParticipantForUserResponse
            {
                Id = participant.Id,
                DisplayName = participant.DisplayName,
                Status = Enum.Parse<ParticipantStatus>(participant.ParticipantStatus.ToString()),
                Role = participant.Role,
                CurrentRoom = Map(participant.CurrentRoom),
                InterpreterRoom = Map(participant.InterpreterRoom),
                LinkedParticipants = participant.LinkedParticipants.Select(x =>
                    new Contract.Responses.LinkedParticipantResponse
                    {
                        LinkedId = x.LinkedId,
                        LinkType = x.LinkType
                    }).ToList()
            })
            .ToList();
        
        ParticipantTilePositionHelper.AssignTilePositions(mappedParticipants);
        
        return mappedParticipants;
    }
    private RoomSummaryResponse Map(ConsultationRoom input)
    {
        if (input == null)
        {
            return null;
        }
        return new RoomSummaryResponse
        {
            Id = input.Id.ToString(), Label = input.Label, Locked = input.Locked
        };
    }
}
