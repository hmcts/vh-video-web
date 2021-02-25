using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseMapper : IMapTo<ParticipantDetailsResponse, ParticipantResponse>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;
        private readonly IMapTo<Services.Video.LinkedParticipantResponse, Contract.Responses.LinkedParticipantResponse> _linkedParticipantResponseMapper;

        public ParticipantResponseMapper(
            IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper,
            IMapTo<Services.Video.LinkedParticipantResponse, Contract.Responses.LinkedParticipantResponse> linkedParticipantResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
            _linkedParticipantResponseMapper = linkedParticipantResponseMapper;
        }

        public ParticipantResponse Map(ParticipantDetailsResponse participant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.Current_status.ToString());
            var role = Enum.Parse<Role>(participant.User_role.ToString());

            var response = new ParticipantResponse
            {
                Id = participant.Id,
                Name = participant.Name,
                Status = status,
                Role = role,
                DisplayName = participant.Display_name,
                CaseTypeGroup = participant.Case_type_group,
                Representee = participant.Representee,
                FirstName = participant.First_name,
                LastName = participant.Last_name,
                HearingRole = participant.Hearing_role,
                CurrentRoom = _roomResponseMapper.Map(participant.Current_room),
                LinkedParticipants = participant.Linked_participants
                    .Select(x => _linkedParticipantResponseMapper.Map(x)).ToList()
            };

            if (role == Role.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.Display_name};{participant.Id}";
            }
            return response;
        }
    }
}
