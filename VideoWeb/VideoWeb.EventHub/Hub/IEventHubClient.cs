using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Hub
{
    public interface IEventHubClient
    {
        Task ParticipantStatusMessage(Guid participantId, string username, Guid conferenceId, ParticipantState participantState);
        Task ParticipantRoomMessage(Guid participantId, string username, Guid conferenceId, string room);
        Task ParticipantMediaStatusMessage(Guid participantId, Guid conferenceId, ParticipantMediaStatus mediaStatus);
        Task EndpointStatusMessage(Guid endpointId, Guid conferenceId, EndpointState endpointState);
        Task ConferenceStatusMessage(Guid conferenceId, ConferenceStatus conferenceState);
        Task CountdownFinished(Guid conferenceId);
        Task RequestedConsultationMessage(Guid conferenceId, string roomLabel, Guid requestedBy, Guid requestedFor);
        Task ConsultationRequestResponseMessage(Guid conferenceId, string roomLabel, Guid requestedFor, ConsultationAnswer answer);
        Task HelpMessage(Guid conferenceId, string participantName);
        Task ReceiveMessage(Guid conferenceId, string from, string to, string message, DateTime timestamp, Guid messageId);
        Task AdminAnsweredChat(Guid conferenceId, string username);
        Task ReceiveHeartbeat(Guid conferenceId, Guid participantId, HeartbeatHealth heartbeatHealth, string browserName, string browserVersion, string osName, string osVersion);
        Task HearingTransfer(Guid conferenceId, Guid participantId, TransferDirection transferDirection);
    }
}
