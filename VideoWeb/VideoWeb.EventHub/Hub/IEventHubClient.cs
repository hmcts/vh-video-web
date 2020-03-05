using System;
using System.Threading.Tasks;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Hub
{
    public interface IEventHubClient
    {
        Task ParticipantStatusMessage(Guid participantId, ParticipantState participantState);
        Task ConferenceStatusMessage(Guid conferenceId, ConferenceState conferenceState);
        Task ConsultationMessage(Guid conferenceId, string requestedBy, string requestedFor, string result);
        Task AdminConsultationMessage(Guid conferenceId, RoomType room, string requestedFor, ConsultationAnswer? answer = null);
        Task HelpMessage(Guid conferenceId, string participantName);
        Task ReceiveMessage(Guid conferenceId, string from, string message, DateTime timestamp, Guid messageUuid);
        Task AdminAnsweredChat(Guid conferenceId);
        Task ReceiveHeartbeat(Guid conferenceId, Guid participantId, HeartbeatHealth heartbeatHealth, string browserName, string browserVersion);
    }
}
