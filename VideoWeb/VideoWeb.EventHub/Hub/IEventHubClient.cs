using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Hub
{
    public interface IEventHubClient
    {
        Task ParticipantStatusMessage(Guid participantId, string username, Guid conferenceId, ParticipantState participantState, string reason);
        Task ParticipantMediaStatusMessage(Guid participantId, Guid conferenceId, ParticipantMediaStatus mediaStatus);
        Task ParticipantRemoteMuteMessage(Guid participantId, Guid conferenceId, bool isRemoteMuted);
        Task ParticipantHandRaiseMessage(Guid participantId, Guid conferenceId, bool hasHandRaised);
        Task EndpointStatusMessage(Guid endpointId, Guid conferenceId, EndpointState endpointState);
        Task ConferenceStatusMessage(Guid conferenceId, ConferenceStatus conferenceState);
        Task CountdownFinished(Guid conferenceId);
        Task RecordingConnectionFailed(Guid conferenceId, Guid participantId);
        Task RequestedConsultationMessage(Guid conferenceId, Guid invitationId, string roomLabel, Guid requestedBy, Guid requestedFor);
        Task ConsultationRequestResponseMessage(Guid conferenceId, Guid invitationId, string roomLabel, Guid requestedFor, Common.Models.ConsultationAnswer answer, Guid responseInitiatorId);
        Task RoomUpdate(Room room);
        Task RoomTransfer(RoomTransfer roomTransfer);
        Task HelpMessage(Guid conferenceId, string participantName);
        Task ReceiveMessage(Guid conferenceId, string from, string fromDisplayName, string to, string message, DateTime timestamp, Guid messageId);
        Task AdminAnsweredChat(Guid conferenceId, string username);
        Task ReceiveHeartbeat(Guid conferenceId, Guid participantId, HeartbeatHealth heartbeatHealth, string browserName, string browserVersion, string osName, string osVersion);
        /// <summary>
        /// When a host transfers a participant in or out of a hearing
        /// </summary>
        /// <param name="conferenceId"></param>
        /// <param name="participantId"></param>
        /// <param name="transferDirection"></param>
        /// <returns></returns>
        Task HearingTransfer(Guid conferenceId, Guid participantId, TransferDirection transferDirection);
        /// <summary>
        /// When a non-host chooses to transfer in or out of a hearing
        /// </summary>
        /// <param name="conferenceId"></param>
        /// <param name="participantId"></param>
        /// <param name="transferDirection"></param>
        /// <returns></returns>
        Task NonHostTransfer(Guid conferenceId, Guid participantId, TransferDirection transferDirection);
        Task ParticipantsUpdatedMessage(Guid conferenceId, List<ParticipantResponse> participants);
        Task HearingLayoutChanged(Guid conferenceId, Guid changedById, HearingLayout newLayout, HearingLayout oldLayout);
        Task NewConferenceAddedMessage(Guid conferenceId);
        [Obsolete("Use AllocationsUpdated instead")]
        Task AllocationHearings(string csoUserName, List<HearingDetailRequest> hearings);
        Task AllocationsUpdated(List<UpdatedAllocationDto> updatedAllocationDtos);
        Task EndpointsUpdated(Guid conferenceId, UpdateEndpointsDto endpoints);
        Task HearingCancelledMessage(Guid conferenceId);
        Task HearingDetailsUpdatedMessage(ConferenceResponse conference);
        /// <summary>
        /// Request a participant's local mute be update. Not to be confused with remote mute (and lock).
        /// </summary>
        /// <param name="conferenceId">The UUID of a conference</param>
        /// <param name="participantId">The UUID of a participant (provided by Video API)</param>
        /// <param name="isMuted">true to mute a participant or false to unmute</param>
        /// <returns></returns>
        Task UpdateParticipantLocalMuteMessage(Guid conferenceId, Guid participantId, bool isMuted);
        Task UnlinkedParticipantFromEndpoint(Guid conferenceId, string endpoint);
        Task LinkedNewParticipantToEndpoint(Guid conferenceId, string endpoint);
        Task CloseConsultationBetweenEndpointAndParticipant(Guid conferenceId, string endpoint);
        Task AudioRestartActioned(Guid conferenceId);
        Task AudioRecordingPaused(Guid conferenceId, bool state);
    }
}
