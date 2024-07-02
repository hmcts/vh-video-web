using System;
using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseForUserMapper : IMapTo<IEnumerable<ParticipantResponse>, List<ParticipantForUserResponse>>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;

        public ParticipantResponseForUserMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }

        public List<ParticipantForUserResponse> Map(IEnumerable<ParticipantResponse> participants)
        {
            var mappedParticipants = participants.Select(participant => new ParticipantForUserResponse
                {
                    Id = participant.Id,
                    DisplayName = participant.DisplayName,
                    Status = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString()),
                    Role = Enum.Parse<Role>(participant.UserRole.ToString()),
                    CurrentRoom = _roomResponseMapper.Map(participant.CurrentRoom),
                    InterpreterRoom = _roomResponseMapper.Map(participant.CurrentInterpreterRoom)
                })
                .ToList();

            ParticipantTilePositionHelper.AssignTilePositions(mappedParticipants);
            
            return mappedParticipants;
        }
    }
}
