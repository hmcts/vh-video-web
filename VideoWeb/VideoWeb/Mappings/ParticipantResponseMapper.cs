using System;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Contract.Responses.UserRole;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseMapper
    {
        public ParticipantResponse MapParticipantToResponseModel(ParticipantDetailsResponse participant, BookingParticipant bookingParticipant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.Current_status.ToString());

            if (!Enum.TryParse(participant.User_role.ToString(), true, out UserRole role))
                role = UserRole.None;

            var response = new ParticipantResponse
            {
                Id = participant.Id,
                FirstName = bookingParticipant?.First_name,
                LastName = bookingParticipant?.Last_name,
                Name = participant.Name,
                Status = status,
                Role = role,
                Username = participant.Username,
                DisplayName = participant.Display_name,
                CaseTypeGroup = participant.Case_type_group,
                Representee = participant.Representee,
                ContactEmail = bookingParticipant?.Contact_email,
                ContactTelephone = bookingParticipant?.Telephone_number
            };

            if (role == UserRole.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.Display_name};{participant.Id}";
            }
            return response;
        }
    }
}
