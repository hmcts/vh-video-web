using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantRequestMapper : IMapTo<ParticipantRequest, IEnumerable<ParticipantDto>, ParticipantDto>
    {
        private readonly IMapTo<LinkedParticipantRequest, IEnumerable<ParticipantDto>, LinkedParticipant> linkedParticipantMapper;
        public ParticipantRequestMapper(IMapperFactory mapperFactory)
        {
            linkedParticipantMapper = mapperFactory.Get<LinkedParticipantRequest, IEnumerable<ParticipantDto>, LinkedParticipant>();
        }
        public ParticipantDto Map(ParticipantRequest request, IEnumerable<ParticipantDto> existingParticipants)
        {
            return new ParticipantDto
            {
                Id = request.Id,
                Name = request.Name,
                Role = (Role)request.UserRole,
                HearingRole = request.HearingRole,

                CaseTypeGroup = request.CaseTypeGroup,
                ContactEmail = request.ContactEmail,
                ContactTelephone = request.ContactTelephone,
                DisplayName = request.DisplayName,
                FirstName = request.FirstName,
                LastName = request.LastName,
                ParticipantStatus = ParticipantStatus.None,
                RefId = request.ParticipantRefId,
                Representee = request.Representee,
                Username = request.Username,
                LinkedParticipants = request.LinkedParticipants.Select(linkedParticipant => linkedParticipantMapper.Map(linkedParticipant, existingParticipants)).ToList()
            };
        }
    }
}
