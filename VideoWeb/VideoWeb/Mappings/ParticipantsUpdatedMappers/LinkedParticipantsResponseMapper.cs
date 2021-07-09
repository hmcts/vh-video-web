using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class LinkedParticipantsResponseMapper : IMapTo<LinkedParticipantRequest, LinkedParticipantsResponse>
    {
        public LinkedParticipantsResponse Map(LinkedParticipantRequest request)
        {
            return new LinkedParticipantsResponse()
            {
                ParticipantReferenceId = request.ParticipantRefId,
                LinkedReferenceId = request.LinkedRefId,
                LinkType = (LinkType)request.Type,
            };
        }
    }
}
