using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantDtoForResponseMapper(IMapperFactory mapperFactory) : IMapTo<Participant, Conference, ParticipantResponse>
    {
        private readonly IMapTo<LinkedParticipant, LinkedParticipantResponse> linkedParticipantMapper = mapperFactory.Get<LinkedParticipant, LinkedParticipantResponse>();
        private readonly IMapTo<CivilianRoom, RoomSummaryResponse> roomMapper = mapperFactory.Get<CivilianRoom, RoomSummaryResponse>();
        private readonly IMapTo<MeetingRoom, RoomSummaryResponse> participantRoomMapper = mapperFactory.Get<MeetingRoom, RoomSummaryResponse>();
        
        public ParticipantResponse Map(Participant participant, Conference conference)
        {
            var response = new ParticipantResponse();
            response.CurrentRoom = participantRoomMapper.Map(participant.CurrentRoom);
            response.InterpreterRoom = roomMapper.Map(conference.GetRoom(participant.Id));
            
            response.DisplayName = participant.DisplayName;
            response.FirstName = participant.FirstName;
            response.HearingRole = participant.HearingRole;
            response.Id = participant.Id;
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
