using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseForVhoMapper : IMapTo<ParticipantDetailsResponse, ParticipantResponseVho>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;

        public ParticipantResponseForVhoMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
        }

        public ParticipantResponseVho Map(ParticipantDetailsResponse participant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.Current_status.ToString());
            var role = Enum.Parse<Role>(participant.User_role.ToString());

            var response = new ParticipantResponseVho
            {
                Id = participant.Id,
                Name = participant.Name,
                Status = status,
                Role = role,
                DisplayName = participant.Display_name,
                CaseTypeGroup = participant.Case_type_group,
                Representee = participant.Representee,
                HearingRole = participant.Hearing_role,
                CurrentRoom = _roomResponseMapper.Map(participant.Current_room)
            };

            if (role == Role.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.Display_name};{participant.Id}";
            }

            return response;
        }
    }
}
