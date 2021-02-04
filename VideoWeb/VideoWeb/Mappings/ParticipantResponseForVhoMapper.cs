using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseForVhoMapper : IMapTo<ParticipantDetailsResponse, ParticipantResponseVho>
    {
        public ParticipantResponseVho Map(ParticipantDetailsResponse participant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.CurrentStatus.ToString());
            var role = Enum.Parse<Role>(participant.UserRole.ToString());

            var response = new ParticipantResponseVho
            {
                Id = participant.Id,
                Name = participant.Name,
                Status = status,
                Role = role,
                DisplayName = participant.DisplayName,
                CaseTypeGroup = participant.CaseTypeGroup,
                Representee = participant.Representee,
                HearingRole = participant.HearingRole
            };

            if (role == Role.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.DisplayName};{participant.Id}";
            }

            return response;
        }
    }
}
