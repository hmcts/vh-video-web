using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantRequestMapper : IMapTo<ParticipantRequest, IEnumerable<Participant>, Participant>
    {
        private readonly IMapTo<LinkedParticipantRequest, IEnumerable<Participant>, LinkedParticipant> linkedParticipantMapper;
        public ParticipantRequestMapper(IMapperFactory mapperFactory)
        {
            linkedParticipantMapper = mapperFactory.Get<LinkedParticipantRequest, IEnumerable<Participant>, LinkedParticipant>();
        }
        public Participant Map(ParticipantRequest request, IEnumerable<Participant> existingParticipants)
        {
            return new Participant
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
