using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;
using VHLinkedParticipantResponse = VideoWeb.Services.Video.LinkedParticipantResponse;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseMapper : IMapTo<ParticipantDetailsResponse, ParticipantResponse>
    {
        private readonly IMapTo<RoomResponse, RoomSummaryResponse> _roomResponseMapper;

        private readonly IMapTo<VHLinkedParticipantResponse, LinkedParticipantResponse>
            _linkedParticipantResponseMapper;

        public ParticipantResponseMapper(IMapTo<RoomResponse, RoomSummaryResponse> roomResponseMapper, IMapTo<VHLinkedParticipantResponse, LinkedParticipantResponse> linkedParticipantResponseMapper)
        {
            _roomResponseMapper = roomResponseMapper;
            _linkedParticipantResponseMapper = linkedParticipantResponseMapper;
        }

        public ParticipantResponse Map(ParticipantDetailsResponse participant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.Current_status.ToString());
            var role = Enum.Parse<Role>(participant.User_role.ToString());
            var links = (participant.Linked_participants ?? new List<VHLinkedParticipantResponse>())
                .Select(_linkedParticipantResponseMapper.Map).ToList();
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
                LinkedParticipants = links
            };

            if (role == Role.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.Display_name};{participant.Id}";
            }

            return response;
        }
    }
}
