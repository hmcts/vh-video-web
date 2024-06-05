using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantToParticipantResponseMapper : IMapTo<ParticipantDto, ConferenceDto, ParticipantResponse>
    {
        private readonly IMapTo<LinkedParticipant, LinkedParticipantResponse> linkedParticipantMapper;
        private readonly IMapTo<CivilianRoomDto, RoomSummaryResponse> roomMapper;
        public ParticipantToParticipantResponseMapper(IMapperFactory mapperFactory)
        {
            linkedParticipantMapper = mapperFactory.Get<LinkedParticipant, LinkedParticipantResponse>();
            roomMapper = mapperFactory.Get<CivilianRoomDto, RoomSummaryResponse>();
        }
        public ParticipantResponse Map(ParticipantDto participantDto, ConferenceDto conferenceDto)
        {
            
            var response = new ParticipantResponse();
            
            response.CaseTypeGroup = participantDto.CaseTypeGroup;
            response.CurrentRoom = null; // This cannot currently be gotten from the conference cache, the UI will keep the current room for an existing user.
            response.DisplayName = participantDto.DisplayName;
            response.FirstName = participantDto.FirstName;
            response.HearingRole = participantDto.HearingRole;
            response.Id = participantDto.Id;
            response.InterpreterRoom = roomMapper.Map(conferenceDto.GetRoom(participantDto.Id));
            response.LastName = participantDto.LastName;
            response.Name = participantDto.Name;
            response.Representee = participantDto.Representee;
            response.Role = participantDto.Role;
            response.Status = participantDto.ParticipantStatus;
            response.LinkedParticipants = participantDto.LinkedParticipants?.Select(x => linkedParticipantMapper.Map(x)).ToList();
            response.UserName = participantDto.Username;
            response.TiledDisplayName = ParticipantTilePositionHelper.GetTiledDisplayName(response);

            return response;
        }
    }
}
