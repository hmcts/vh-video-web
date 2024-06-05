using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseMapper : IMapTo<Participant, ParticipantResponse>
    {
        private readonly IMapTo<MeetingRoomDto, RoomSummaryResponse> _roomResponseMapper;
        private readonly IMapTo<LinkedParticipant, LinkedParticipantResponse> _linkedParticipantResponseMapper;

        public ParticipantResponseMapper(IMapTo<MeetingRoomDto, RoomSummaryResponse> roomResponseMapper, IMapTo<LinkedParticipant, LinkedParticipantResponse> linkedParticipantResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
            _linkedParticipantResponseMapper = linkedParticipantResponseMapper;
        }

        public ParticipantResponse Map(Participant participant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.ParticipantStatus.ToString());
            var role = Enum.Parse<Role>(participant.Role.ToString());
            var links = participant.LinkedParticipants?.Select(_linkedParticipantResponseMapper.Map).ToList();
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
                CurrentRoom = _roomResponseMapper.Map(participant.CurrentRoomDto),
                InterpreterRoom = _roomResponseMapper.Map(participant.InterpreterRoomDto),
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
