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
            
            var response = new ParticipantResponse();
            response.CurrentRoom = null; // This cannot currently be gotten from the conference cache, the UI will keep the current room for an existing user.
            response.DisplayName = participant.DisplayName;
            response.FirstName = participant.FirstName;
            response.HearingRole = participant.HearingRole;
            response.Id = participant.Id;
            response.InterpreterRoom = roomMapper.Map(conference.GetRoom(participant.Id));
            response.LastName = participant.LastName;
            response.Name = participant.FirstName + " " + participant.LastName;
            response.Representee = participant.Representee;
            response.Role = participant.Role;
            response.Status = participant.ParticipantStatus;
            response.LinkedParticipants = participant.LinkedParticipants?.Select(x => linkedParticipantMapper.Map(x)).ToList();
            response.UserName = participant.Username;
            response.TiledDisplayName = ParticipantTilePositionHelper.GetTiledDisplayName(response);

            return response;
        }
    }
}
