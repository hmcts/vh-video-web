using System.Linq;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantRequestMapper : IMapTo<ParticipantRequest, Participant>
    {
        private readonly IMapTo<LinkedParticipantRequest, LinkedParticipant> linkedParticipantMapper;
        public ParticipantRequestMapper(IMapperFactory mapperFactory)
        {
            linkedParticipantMapper = mapperFactory.Get<LinkedParticipantRequest, LinkedParticipant>();
        }
        public Participant Map(ParticipantRequest request)
        {
            return new Participant
            {
                Id = request.ParticipantRefId,
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
                LinkedParticipants = request.LinkedParticipants.Select(linkedParticipant => linkedParticipantMapper.Map(linkedParticipant)).ToList()
            };
        }
    }
}
