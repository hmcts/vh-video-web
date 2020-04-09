using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ParticipantStatus = VideoWeb.Contract.Responses.ParticipantStatus;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;

namespace VideoWeb.Mappings
{
    public static class ParticipantResponseForVhoMapper
    {
        public static ParticipantResponseVho MapParticipantToResponseModel(ParticipantDetailsResponse participant, BookingParticipant bookingParticipant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.Current_status.ToString());
            var role = Enum.Parse<Role>(participant.User_role.ToString());

            var response = new ParticipantResponseVho
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

            if (role == Role.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.Display_name};{participant.Id}";
            }

            return response;
        }

    }
}
