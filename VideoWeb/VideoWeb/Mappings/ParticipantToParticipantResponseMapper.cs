using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantToParticipantResponseMapper : IMapTo<Participant, ParticipantResponse>
    {
        private readonly IMapperFactory _mapperFactory;
        public ParticipantToParticipantResponseMapper(IMapperFactory mapperFactory)
        {
            _mapperFactory = mapperFactory;
        }
        public ParticipantResponse Map(Participant input)
        {
            var linkedParticipantMapper = _mapperFactory.Get<LinkedParticipant, LinkedParticipantResponse>();
            return new ParticipantResponse()
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
                TiledDisplayName = input.DisplayName, // TODO where does this come from? normally
                LinkedParticipants = input.LinkedParticipants.Select(x => linkedParticipantMapper.Map(x)).ToList(),
            };
        }
    }
}
