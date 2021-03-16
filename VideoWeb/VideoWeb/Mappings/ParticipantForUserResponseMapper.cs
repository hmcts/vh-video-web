using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class ParticipantForUserResponseMapper : IMapTo<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;

        public ParticipantForUserResponseMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }

        public List<ParticipantForUserResponse> Map(IEnumerable<ParticipantSummaryResponse> participants)
        {
            var mappedParticipants = participants.Select(participant => new ParticipantForUserResponse
                {
                    Id = participant.Id,
                    DisplayName = participant.DisplayName,
                    Status = Enum.Parse<ParticipantStatus>(participant.Status.ToString()),
                    Role = Enum.Parse<Role>(participant.UserRole.ToString()),
                    Representee = string.IsNullOrWhiteSpace(participant.Representee) ? null : participant.Representee,
                    CaseTypeGroup = participant.CaseGroup,
                    FirstName = participant.FirstName,
                    LastName = participant.LastName,
                    HearingRole = participant.HearingRole,
                    CurrentRoom = _roomResponseMapper.Map(participant.CurrentRoom),
                    InterpreterRoom = _roomResponseMapper.Map(participant.CurrentInterpreterRoom),
                    LinkedParticipants = participant.LinkedParticipants.Select(x =>
                        new Contract.Responses.LinkedParticipantResponse
                        {
                            LinkedId = x.LinkedId,
                            LinkType = Enum.Parse<LinkType>(x.Type.ToString(), true)
                        }).ToList()
                })
                .ToList();

            ParticipantTilePositionHelper.AssignTilePositions(mappedParticipants);
            
            return mappedParticipants;
        }
    }
}
