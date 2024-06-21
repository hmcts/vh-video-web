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
    public class ParticipantToParticipantResponseMapper : IMapTo<Participant, Conference, ParticipantResponse>
    {
        private readonly IMapTo<LinkedParticipant, LinkedParticipantResponse> linkedParticipantMapper;
        private readonly IMapTo<CivilianRoom, RoomSummaryResponse> roomMapper;
        public ParticipantToParticipantResponseMapper(IMapperFactory mapperFactory)
        {
            linkedParticipantMapper = mapperFactory.Get<LinkedParticipant, LinkedParticipantResponse>();
            roomMapper = mapperFactory.Get<CivilianRoom, RoomSummaryResponse>();
        }
        public ParticipantResponse Map(Participant participant, Conference conference)
        {
            
            var response = new ParticipantResponse()
            {
                CaseTypeGroup = participant.CaseTypeGroup,
                CurrentRoom = MapParticipantRoom(participant.CurrentRoom),
                DisplayName = participant.DisplayName,
                FirstName = participant.FirstName,
                HearingRole = participant.HearingRole,
                Id = participant.Id,
                InterpreterRoom = roomMapper.Map(conference.GetRoom(participant.Id)),
                LastName = participant.LastName,
                Name = participant.Name,
                Representee = participant.Representee,
                Role = participant.Role,
                Status = participant.ParticipantStatus,
                LinkedParticipants = participant.LinkedParticipants.Select(x => linkedParticipantMapper.Map(x)).ToList(),
                UserName = participant.Username
            };

            response.TiledDisplayName = ParticipantTilePositionHelper.GetTiledDisplayName(response);

            return response;
        }
        
        private static RoomSummaryResponse MapParticipantRoom(ParticipantRoom participantRoom)
        {
            if (participantRoom == null) return null;
            
            return new RoomSummaryResponse
            {
                Id = participantRoom.Id.ToString(),
                Label = participantRoom.Label,
                Locked = participantRoom.Locked
            };
        }
    }
}
