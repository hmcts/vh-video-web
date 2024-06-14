using System;
using System.Linq;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantDetailsResponseMapper : IMapTo<ParticipantResponse, Participant>
    {
        /// <summary>
        /// TODO: Incompleted properties list
        /// </summary>
        /// <param name="participantDetails"></param>
        /// <returns></returns>
        public Participant Map(ParticipantResponse participantDetails)
        {
            var participant = new Participant();

            participant.Id = participantDetails.Id;
            participant.Username = participantDetails.Username;
            participant.Role = Enum.Parse<Role>(participantDetails.UserRole.ToString());
            participant.ParticipantStatus = Enum.Parse<ParticipantStatus>(participantDetails.CurrentStatus.ToString());
            participant.DisplayName = participantDetails.DisplayName;
            participant.RefId = participantDetails.RefId;
            participant.LinkedParticipants = participantDetails.LinkedParticipants.Select(x => new LinkedParticipant()
            {
                LinkedId = x.LinkedId,
                LinkType = Enum.Parse<LinkType>(x.Type.ToString())
            }).ToList();

            return participant;
        }
    }
}
