using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantAddedResponseMapper : IMapTo<ParticipantRequest, ParticipantAddedResponse>
    {
        public ParticipantAddedResponse Map(ParticipantRequest request)
        {
            return new ParticipantAddedResponse()
            {
                ReferenceId = request.ParticipantRefId,
                Name = request.Name,
                HearingRole = request.HearingRole,
                CaseTypeGroup = request.CaseTypeGroup,
            };
        }
    }
}
