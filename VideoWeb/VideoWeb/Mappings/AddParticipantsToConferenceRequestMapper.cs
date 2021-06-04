using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantRequestMapper : IMapTo<ParticipantRequest, Participant>
    {
        public Participant Map(ParticipantRequest request)
        {
            return new Participant
            {
                Id = request.ParticipantRefId, // TODO This might not work, we don't get the id until we hit video api. Confirm if Ref id is correct
                Name = request.Name,
                FirstName = request.FirstName,
                LastName = request.LastName,
                ContactEmail = request.ContactEmail,
                ContactTelephone = request.ContactTelephone,
                Username = request.Username,
                Role = (Role)request.UserRole, // TODO map correctly
                HearingRole = request.HearingRole,
                // ParticipantStatus  TODO confirm what initial status should be
                DisplayName = request.DisplayName,
                CaseTypeGroup = request.CaseTypeGroup,
                RefId = request.ParticipantRefId,
                Representee = request.Representee,
                //LinkedParticipants = request TODO  mapper for linked participants

            };
        }
    }
}
