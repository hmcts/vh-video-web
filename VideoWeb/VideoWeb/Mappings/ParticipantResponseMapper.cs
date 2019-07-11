using System;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Contract.Responses.UserRole;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;

namespace VideoWeb.Mappings
{
    public class ParticipantResponseMapper
    {
        public ParticipantResponse MapParticipantToResponseModel(ParticipantDetailsResponse participant,
            BookingParticipant bookingParticipant)
        {
            if (bookingParticipant == null)
            {
                throw new ArgumentNullException(nameof(bookingParticipant),
                    $"Could not find participant in bookings for participant ${participant.Id}");
            }
            
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
                FirstName = bookingParticipant.First_name,
                LastName = bookingParticipant.Last_name,
                Name = participant.Name,
                Status = status,
                Role = role,
                Username = participant.Username,
                DisplayName = participant.Display_name,
                CaseTypeGroup = participant.Case_type_group,
                Representee = participant.Representee,
                ContactEmail = bookingParticipant.Contact_email,
                ContactTelephone = bookingParticipant.Telephone_number
            };

            if (role == UserRole.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.Display_name};{participant.Id}";
            }
            return response;
        }
    }
}