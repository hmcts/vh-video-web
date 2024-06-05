using System;
using System.Linq;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantDetailsResponseMapper : IMapTo<ParticipantDetailsResponse, ParticipantDto>
    {
        public ParticipantDetailsResponseMapper()
        {
        }

        public ParticipantDto Map(ParticipantDetailsResponse participantDetails)
        {
            var participant = new ParticipantDto();

            participant.Id = participantDetails.Id;
            participant.Name = participantDetails.Name;
            participant.FirstName = participantDetails.FirstName;
            participant.LastName = participantDetails.LastName;
            participant.ContactEmail = participantDetails.ContactEmail;
            participant.ContactTelephone = participantDetails.ContactTelephone;
            participant.Username = participantDetails.Username;
            participant.Role = Enum.Parse<Role>(participantDetails.UserRole.ToString());
            participant.HearingRole = participantDetails.HearingRole;
            participant.ParticipantStatus = Enum.Parse<ParticipantStatus>(participantDetails.CurrentStatus.ToString());
            participant.DisplayName = participantDetails.DisplayName;
            participant.CaseTypeGroup = participantDetails.CaseTypeGroup;
            participant.RefId = participantDetails.RefId;
            participant.Representee = participantDetails.Representee;
            participant.LinkedParticipants = participantDetails.LinkedParticipants.Select(x => new LinkedParticipant()
            {
                LinkedId = x.LinkedId,
                LinkType = Enum.Parse<LinkType>(x.Type.ToString())
            }).ToList();

            return participant;
        }
    }
}
