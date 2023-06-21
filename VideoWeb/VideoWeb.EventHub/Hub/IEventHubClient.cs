using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
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
        Task ConsultationRequestResponseMessage(Guid conferenceId, Guid invitationId, string roomLabel, Guid requestedFor, Common.Models.ConsultationAnswer answer, Guid responseInitiatorId);
        Task RoomUpdate(Room room);
        Task RoomTransfer(RoomTransfer roomTransfer);
        Task HelpMessage(Guid conferenceId, string participantName);
        Task ReceiveMessage(Guid conferenceId, string from, string to, string message, DateTime timestamp, Guid messageId);
        Task AdminAnsweredChat(Guid conferenceId, string username);
        Task ReceiveHeartbeat(Guid conferenceId, Guid participantId, HeartbeatHealth heartbeatHealth, string browserName, string browserVersion, string osName, string osVersion);
        Task HearingTransfer(Guid conferenceId, Guid participantId, TransferDirection transferDirection);
        Task ParticipantsUpdatedMessage(Guid conferenceId, List<ParticipantResponse> participants);
        Task HearingLayoutChanged(Guid conferenceId, Guid changedById, HearingLayout newLayout, HearingLayout oldLayout);
        Task NewConferenceAddedMessage(Guid conferenceId);
        Task AllocationHearings(string csoUserName, List<HearingDetailRequest> hearings);
        Task EndpointsUpdated(Guid conferenceId, UpdateEndpointsDto endpoints);
        
        /// <summary>
        /// Request a participant's local mute be update. Not to be confused with remote mute (and lock).
        /// </summary>
        /// <param name="conferenceId">The UUID of a conference</param>
        /// <param name="participantId">The UUID of a participant (provided by Video API)</param>
        /// <param name="isMuted">true to mute a participant or false to unmute</param>
        /// <returns></returns>
        Task UpdateParticipantLocalMuteMessage(Guid conferenceId, Guid participantId, bool isMuted);
    }
}
