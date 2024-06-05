using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseMapper : IMapTo<ParticipantDto, ParticipantResponse>
    {
        private readonly IMapTo<ParticipantMeetingRoom, RoomSummaryResponse> _roomResponseMapper;

        private readonly IMapTo<LinkedParticipant, LinkedParticipantResponse> _linkedParticipantResponseMapper;

        public ParticipantResponseMapper(IMapTo<ParticipantMeetingRoom, RoomSummaryResponse> roomResponseMapper, IMapTo<LinkedParticipant, LinkedParticipantResponse> linkedParticipantResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
            _linkedParticipantResponseMapper = linkedParticipantResponseMapper;
        }

        public ParticipantResponse Map(ParticipantDto participantDto)
        {
            var status = Enum.Parse<ParticipantStatus>(participantDto.ParticipantStatus.ToString());
            var role = Enum.Parse<Role>(participantDto.Role.ToString());
            var links = participantDto.LinkedParticipants?.Select(_linkedParticipantResponseMapper.Map).ToList();
            var response = new ParticipantResponse
            {
                Id = participantDto.Id,
                Name = participantDto.Name,
                Status = status,
                Role = role,
                DisplayName = participantDto.DisplayName,
                CaseTypeGroup = participantDto.CaseTypeGroup,
                Representee = participantDto.Representee,
                FirstName = participantDto.FirstName,
                LastName = participantDto.LastName,
                HearingRole = participantDto.HearingRole,
                CurrentRoom = _roomResponseMapper.Map(participantDto.CurrentRoom),
                InterpreterRoom = _roomResponseMapper.Map(participantDto.InterpreterRoom),
                LinkedParticipants = links,
                UserName = participantDto.Username
            };

            if (role == Role.Judge)
            {
                response.TiledDisplayName = $"T{0};{participantDto.DisplayName};{participantDto.Id}";
            }

            return response;
        }
    }
}
