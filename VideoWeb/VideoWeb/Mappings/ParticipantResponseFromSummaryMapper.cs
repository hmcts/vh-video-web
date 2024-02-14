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

namespace VideoWeb.Mappings
{
    public class ParticipantResponseFromSummaryMapper : IMapTo<ParticipantSummaryResponse, ParticipantResponse>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;

        private readonly IMapTo<VHLinkedParticipantResponse, LinkedParticipantResponse> _linkedParticipantResponseMapper;

        public ParticipantResponseFromSummaryMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper, IMapTo<VHLinkedParticipantResponse, LinkedParticipantResponse> linkedParticipantResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
            _linkedParticipantResponseMapper = linkedParticipantResponseMapper;
        }
        
        public ParticipantResponse Map(ParticipantSummaryResponse participant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.Status.ToString());
            var role = Enum.Parse<Role>(participant.UserRole.ToString());
            var links = (participant.LinkedParticipants ?? new List<VHLinkedParticipantResponse>())
                .Select(_linkedParticipantResponseMapper.Map).ToList();
            var response = new ParticipantResponse
            {
                Id = participant.Id,
                Name = $"{participant.FirstName} {participant.LastName}",
                Status = status,
                Role = role,
                DisplayName = participant.DisplayName,
                CaseTypeGroup = participant.CaseGroup,
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
