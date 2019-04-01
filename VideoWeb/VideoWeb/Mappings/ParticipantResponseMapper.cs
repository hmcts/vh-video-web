using System;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseMapper
    {
        public ParticipantResponse MapParticipantToResponseModel(ParticipantDetailsResponse participant)
        {
            var status = ParticipantStatus.None;
            if (participant.Current_status?.Participant_state != null)
            {
                status =
                    Enum.Parse<ParticipantStatus>(participant.Current_status.Participant_state.GetValueOrDefault()
                        .ToString());
            }

            var role = UserRole.None;
            if (participant.User_role != null)
            {
                role = Enum.Parse<UserRole>(participant.User_role.GetValueOrDefault().ToString());
            }

            var response = new ParticipantResponse
            {
                Id = participant.Id.GetValueOrDefault(),
                Name = participant.Name,
                Status = status,
                Role = role,
                Username = participant.Username,
                DisplayName = participant.Display_name
            };

            if (role == UserRole.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.Display_name};{participant.Id}";
            }
            return response;
        }
    }
}