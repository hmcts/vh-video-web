using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantDtoForUserResponseMapper : IMapTo<IEnumerable<Participant>, List<ParticipantForUserResponse>>
    {
        private readonly IMapTo<MeetingRoom, RoomSummaryResponse> _roomResponseMapper;

        public ParticipantDtoForUserResponseMapper(IMapTo<MeetingRoom, RoomSummaryResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }

        public List<ParticipantForUserResponse> Map(IEnumerable<Participant> participants)
        {
            var mappedParticipants = participants.Select(participant => new ParticipantForUserResponse
                {
                    Id = participant.Id,
                    DisplayName = participant.DisplayName,
                    Status = Enum.Parse<ParticipantStatus>(participant.ParticipantStatus.ToString()),
                    Role = participant.Role,
                    CurrentRoom = _roomResponseMapper.Map(participant.CurrentRoom),
                    InterpreterRoom = _roomResponseMapper.Map(participant.InterpreterRoom),
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
    }
}
