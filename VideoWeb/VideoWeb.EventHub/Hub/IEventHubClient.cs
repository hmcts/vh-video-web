using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Hub
{
    public interface IEventHubClient
    {
        Task ParticipantStatusMessage(Guid participantId, string username, Guid conferenceId, ParticipantState participantState);
        Task ParticipantMediaStatusMessage(Guid participantId, Guid conferenceId, ParticipantMediaStatus mediaStatus);
        Task ParticipantRemoteMuteMessage(Guid participantId, Guid conferenceId, bool isRemoteMuted);
        Task ParticipantHandRaiseMessage(Guid participantId, Guid conferenceId, bool hasHandRaised);
        Task EndpointStatusMessage(Guid endpointId, Guid conferenceId, EndpointState endpointState);
        Task ConferenceStatusMessage(Guid conferenceId, ConferenceStatus conferenceState);
        Task CountdownFinished(Guid conferenceId);
        Task RequestedConsultationMessage(Guid conferenceId, Guid invitationId, string roomLabel, Guid requestedBy, Guid requestedFor);
        Task ConsultationRequestResponseMessage(Guid conferenceId, Guid invitationId, string roomLabel, Guid requestedFor, ConsultationAnswer answer, Guid responseInitiatorId);
        Task RoomUpdate(Room room);
        Task RoomTransfer(RoomTransfer roomTransfer);
        Task HelpMessage(Guid conferenceId, string participantName);
        Task ReceiveMessage(Guid conferenceId, string from, string to, string message, DateTime timestamp, Guid messageId);
        Task AdminAnsweredChat(Guid conferenceId, string username);
        Task ReceiveHeartbeat(Guid conferenceId, Guid participantId, HeartbeatHealth heartbeatHealth, string browserName, string browserVersion, string osName, string osVersion);
        Task HearingTransfer(Guid conferenceId, Guid participantId, TransferDirection transferDirection);
        Task ParticipantAdded(Guid conferenceId, ParticipantResponse participant);
    }
}
