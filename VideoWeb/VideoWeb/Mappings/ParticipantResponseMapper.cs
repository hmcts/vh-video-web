using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;
using VHLinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;
using RoomResponse = VideoApi.Contract.Responses.RoomResponse;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseMapper : IMapTo<ParticipantDetailsResponse, ParticipantResponse>
    {
        private readonly IMapTo<RoomResponse, Common.Models.RoomResponse> _roomResponseMapper;

        private readonly IMapTo<VHLinkedParticipantResponse, LinkedParticipantResponse> _linkedParticipantResponseMapper;

        public ParticipantResponseMapper(IMapTo<RoomResponse, Common.Models.RoomResponse> roomResponseMapper, IMapTo<VHLinkedParticipantResponse, LinkedParticipantResponse> linkedParticipantResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
            _linkedParticipantResponseMapper = linkedParticipantResponseMapper;
        }

        public ParticipantResponse Map(ParticipantDetailsResponse participant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString());
            var role = Enum.Parse<Role>(participant.UserRole.ToString());
            var links = (participant.LinkedParticipants ?? new List<VHLinkedParticipantResponse>())
                .Select(_linkedParticipantResponseMapper.Map).ToList();
            var response = new ParticipantResponse
            {
                Id = participant.Id,
                Name = participant.Name,
                Status = status,
                Role = role,
                DisplayName = participant.DisplayName,
                CaseTypeGroup = participant.CaseTypeGroup,
                Representee = participant.Representee,
                FirstName = participant.FirstName,
                LastName = participant.LastName,
                HearingRole = participant.HearingRole,
                CurrentRoom = _roomResponseMapper.Map(participant.CurrentRoom),
                InterpreterRoom = _roomResponseMapper.Map(participant.CurrentInterpreterRoom),
                LinkedParticipants = links,
                UserName = participant.Username
            };

            if (role == Role.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.DisplayName};{participant.Id}";
            }

            return response;
        }
    }
}
