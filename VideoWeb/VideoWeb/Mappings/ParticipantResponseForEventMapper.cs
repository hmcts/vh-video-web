using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseForEventMapper : IMapTo<Participant, ParticipantResponse>
    {
        public ParticipantResponse Map(Participant participant)
        {
            var response = new ParticipantResponse
            {
                Id = participant.Id,
                Name = participant.Name,
                Status = participant.ParticipantStatus,
                Role = participant.Role,
                DisplayName = participant.DisplayName,
                CaseTypeGroup = participant.CaseTypeGroup,
                Representee = participant.Representee,
                FirstName = participant.FirstName,
                LastName = participant.LastName,
                HearingRole = participant.HearingRole,
            };
            return response;
        }
    }
}
