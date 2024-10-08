﻿using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.EventHub.Services
{
    public interface IConsultationNotifier
    {
        Task<Guid> NotifyConsultationRequestAsync(Conference conference, string roomLabel, Guid requestedById,
            Guid requestedForId);

        Task NotifyConsultationResponseAsync(Conference conference, Guid invitationId, string roomLabel,
            Guid requestedForId, ConsultationAnswer answer);

        Task NotifyRoomUpdateAsync(Conference conference, Room room);
        Task NotifyParticipantTransferring(Conference conference, Guid participantId, string roomLabel);
    }
}
