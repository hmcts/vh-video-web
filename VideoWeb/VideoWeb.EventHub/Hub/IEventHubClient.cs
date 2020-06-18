using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Hub
{
    public interface IEventHubClient
    {
        Task ParticipantStatusMessage(Guid participantId, string username, Guid conferenceId, ParticipantState participantState);
        Task ConferenceStatusMessage(Guid conferenceId, ConferenceStatus conferenceState);
        Task ConsultationMessage(Guid conferenceId, string requestedBy, string requestedFor, ConsultationAnswer? result);
        Task AdminConsultationMessage(Guid conferenceId, RoomType room, string requestedFor, ConsultationAnswer? answer = null);
        Task HelpMessage(Guid conferenceId, string participantName);
        Task ReceiveMessage(Guid conferenceId, string from, string to, string message, DateTime timestamp, Guid messageId);
        Task AdminAnsweredChat(Guid conferenceId, string username);
        Task ReceiveHeartbeat(Guid conferenceId, Guid participantId, HeartbeatHealth heartbeatHealth, string browserName, string browserVersion);
    }
}
