using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantDtoForResponseMapper : IMapTo<Participant, ParticipantResponse>
    {
        public ParticipantResponse Map(Participant participant)
        {
            var response = new ParticipantResponse();
            response.DisplayName = participant.DisplayName;
            response.FirstName = participant.FirstName;
            response.HearingRole = participant.HearingRole;
            response.Id = participant.Id;
            response.LastName = participant.LastName;
            response.Name = participant.FullTitledName;
            response.Representee = participant.Representee;
            response.Role = participant.Role;
            response.Status = participant.ParticipantStatus;
            response.LinkedParticipants = participant.LinkedParticipants?.Select(e => new LinkedParticipantResponse { LinkedId = e.LinkedId, LinkType = e.LinkType }).ToList();
            response.UserName = participant.Username;
            response.TiledDisplayName = ParticipantTilePositionHelper.GetTiledDisplayName(response);
            response.CurrentRoom = Map(participant.CurrentRoom);
            response.InterpreterRoom  = Map(participant.InterpreterRoom);

            return response;
        }
        
        private RoomSummaryResponse Map(ConsultationRoom input)
        {
            if (input == null)
            {
                return null;
            }
            
            return new RoomSummaryResponse
            {
                Id = input.Id.ToString(), Label = input.Label, Locked = input.Locked
            };
        }
    }
}
