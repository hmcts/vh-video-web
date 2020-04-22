using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;

namespace VideoWeb.Mappings
{
    public static class ParticipantResponseForVhoMapper
    {
        public static ParticipantResponseVho MapParticipantTo(ParticipantDetailsResponse participant)
        {
            var status = Enum.Parse<ParticipantStatus>(participant.Current_status.ToString());
            var role = Enum.Parse<Role>(participant.User_role.ToString());

            var response = new ParticipantResponseVho
            {
                Id = participant.Id,
                Name = participant.Name,
                Status = status,
                Role = role,
                Username = participant.Username,
                DisplayName = participant.Display_name,
                CaseTypeGroup = participant.Case_type_group,
                Representee = participant.Representee,
            };

            if (role == Role.Judge)
            {
                response.TiledDisplayName = $"T{0};{participant.Display_name};{participant.Id}";
            }

            return response;
        }

        public static IEnumerable<ParticipantContactDetailsResponseVho> MapParticipantsTo(
            IEnumerable<Participant> participants,
            IEnumerable<BookingParticipant> bookingParticipants)
        {
            return participants
                .OrderBy(x => x.CaseTypeGroup)
                .Select(x =>
                {
                    var status = Enum.Parse<ParticipantStatus>(x.ParticipantStatus.ToString());
                    var bookingParticipant = bookingParticipants.SingleOrDefault(p => x.RefId == p.Id);

                    return new ParticipantContactDetailsResponseVho
                    {
                        Id = x.Id,
                        Name = x.Name,
                        Role = x.Role,
                        Username = x.Username,
                        CaseTypeGroup = x.CaseTypeGroup,
                        RefId = x.RefId,
                        FirstName = bookingParticipant?.First_name,
                        LastName = bookingParticipant?.Last_name,
                        DisplayName = x.DisplayName,
                        Status = status,
                        ContactEmail = bookingParticipant?.Contact_email,
                        ContactTelephone = bookingParticipant?.Telephone_number,
                        
                    };
                });
        }
    }
}
