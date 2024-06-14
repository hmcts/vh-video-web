using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseForVhoMapper : IMapTo<ParticipantResponse, ParticipantResponseVho>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;

        public ParticipantResponseForVhoMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }

        /// <summary>
        /// TODO: Properties removed, verify before removing todo
        /// </summary>
        public ParticipantResponseVho Map(ParticipantResponse participant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString());
            var role = Enum.Parse<Role>(participant.UserRole.ToString());

            var response = new ParticipantResponseVho
            {
                Id = participant.Id,
                Status = status,
                Role = role,
                DisplayName = participant.DisplayName,
                CurrentRoom = _roomResponseMapper.Map(participant.CurrentRoom),
                InterpreterRoom = _roomResponseMapper.Map(participant.CurrentInterpreterRoom),
                LinkedParticipants = participant.LinkedParticipants.Select(lp => new Contract.Responses.LinkedParticipantResponse
                {
                    LinkedId = lp.LinkedId,
                    LinkType = (LinkType)lp.Type
                }).ToList()
            };

            if (role == Role.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.DisplayName};{participant.Id}";
            }

            return response;
        }
    }
}
