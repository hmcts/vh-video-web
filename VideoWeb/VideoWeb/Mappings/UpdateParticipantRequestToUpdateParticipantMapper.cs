using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class UpdateParticipantRequestToUpdateParticipantMapper : IMapTo<UpdateParticipantRequest, IEnumerable<Participant>, UpdateParticipant>
    {
        private readonly IMapTo<LinkedParticipantRequest, IEnumerable<Participant>, LinkedParticipant> linkedParticipantMapper;
        public UpdateParticipantRequestToUpdateParticipantMapper(IMapperFactory mapperFactory)
        {
            linkedParticipantMapper = mapperFactory.Get<LinkedParticipantRequest, IEnumerable<Participant>, LinkedParticipant>();
        }

        public UpdateParticipant Map(UpdateParticipantRequest request, IEnumerable<Participant> existingParticipants)
        {
            return new UpdateParticipant()
            {
                ContactEmail = request.ContactEmail,
                ContactTelephone = request.ContactTelephone,
                DisplayName = request.DisplayName,
                FirstName = request.FirstName,
                Fullname = request.Fullname,
                LastName = request.LastName,
                ParticipantRefId = request.ParticipantRefId,
                Representee = request.Representee,
                Username = request.Username,
                LinkedParticipants = request.LinkedParticipants.Select(linkedParticipant => linkedParticipantMapper.Map(linkedParticipant, existingParticipants)).ToList()
            };
        }
    }
}
