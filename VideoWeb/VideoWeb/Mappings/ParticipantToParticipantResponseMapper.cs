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
    public class ParticipantToParticipantResponseMapper : IMapTo<Participant, ParticipantResponse>
    {
        private readonly IMapTo<LinkedParticipant, LinkedParticipantResponse> linkedParticipantMapper;
        public ParticipantToParticipantResponseMapper(IMapperFactory mapperFactory)
        {
            linkedParticipantMapper = mapperFactory.Get<LinkedParticipant, LinkedParticipantResponse>();
        }
        public ParticipantResponse Map(Participant input)
        {
            
            var response = new ParticipantResponse()
            {
                CaseTypeGroup = input.CaseTypeGroup,
                CurrentRoom = null,
                DisplayName = input.DisplayName,
                FirstName = input.FirstName,
                HearingRole = input.HearingRole,
                Id = input.Id,
                InterpreterRoom = null,
                LastName = input.LastName,
                Name = input.Name,
                Representee = input.Representee,
                Role = input.Role,
                Status = input.ParticipantStatus,
                LinkedParticipants = input.LinkedParticipants.Select(x => linkedParticipantMapper.Map(x)).ToList(),
            };

            response.TiledDisplayName = ParticipantTilePositionHelper.GetTiledDisplayName(response);

            return response;
        }
    }
}
