using System;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseMapper
    {
        public ParticipantResponse MapParticipantToResponseModel(ParticipantDetailsResponse participant)
        {
            var status =
                Enum.Parse<ParticipantStatus>(participant.Current_status.Participant_state.GetValueOrDefault()
                    .ToString());
            
            var role =
                Enum.Parse<ParticipantRole>(participant.User_role.GetValueOrDefault()
                    .ToString());
            var response = new ParticipantResponse
            {
                Id = participant.Id.GetValueOrDefault(),
                Name = participant.Name,
                Status = status,
                Role = role
            };
            return response;
        }
    }
}