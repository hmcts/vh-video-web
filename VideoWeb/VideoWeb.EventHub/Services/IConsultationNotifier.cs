using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Services
{
    public interface IConsultationNotifier
    {
        Task<Guid> NotifyConsultationRequestAsync(ConferenceDto conferenceDto, string roomLabel, Guid requestedById,
            Guid requestedForId);

        Task NotifyConsultationResponseAsync(ConferenceDto conferenceDto, Guid invitationId, string roomLabel,
            Guid requestedForId, ConsultationAnswer answer);

        Task NotifyRoomUpdateAsync(ConferenceDto conferenceDto, Room room);
        Task NotifyParticipantTransferring(ConferenceDto conferenceDto, Guid participantId, string roomLabel);
    }
}
