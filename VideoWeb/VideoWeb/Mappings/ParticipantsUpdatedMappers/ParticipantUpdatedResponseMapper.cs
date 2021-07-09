using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantUpdatedResponseMapper : IMapTo<UpdateParticipantRequest, ParticipantUpdatedResponse>
    {
        public ParticipantUpdatedResponse Map(UpdateParticipantRequest request)
        {
            return new ParticipantUpdatedResponse()
            {
                ReferenceId = request.ParticipantRefId,
                Name = request.Fullname,
                FirstName = request.FirstName,
                LastName = request.LastName,
                DisplayName = request.DisplayName,
            };
        }
    }
}
