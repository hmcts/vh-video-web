using System;
using System.Linq;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Logging;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using EndpointState = VideoWeb.EventHub.Enums.EndpointState;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;
using Task = System.Threading.Tasks.Task;

namespace VideoWeb.EventHub.Handlers.Core
{
    public abstract class EventHandlerBase(
        IHubContext<Hub.EventHub, IEventHubClient> hubContext,
        IConferenceService conferenceService,
        ILogger<EventHandlerBase> logger)
        : IEventHandler
    {
        public abstract EventType EventType { get; }
        public Participant SourceParticipant { get; set; }
        protected Conference SourceConference { get; set; }
        protected Endpoint SourceEndpoint { get; set; }
        protected readonly IHubContext<Hub.EventHub, IEventHubClient> HubContext = hubContext;
        protected readonly ILogger<EventHandlerBase> Logger = logger;

        public virtual async Task HandleAsync(CallbackEvent callbackEvent)
        {
            SourceConference = await conferenceService.GetConference(callbackEvent.ConferenceId);
            if (SourceConference == null) throw new ConferenceNotFoundException(callbackEvent.ConferenceId);
            SourceParticipant = SourceConference.Participants
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);
            SourceEndpoint = SourceConference.Endpoints
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);

            Logger.LogHandlingEvent(callbackEvent.EventType.ToString(), callbackEvent.ConferenceId, callbackEvent.Reason);

            await PublishStatusAsync(callbackEvent);
        }


        /// <summary>
        ///     Publish a participant event to all participants in conference to those connected to the HubContext
        /// </summary>
        /// <param name="participantState">Participant status event to publish</param>
        /// <param name="newStatus">the new status to publish</param>
        /// <param name="reason">reason for the disconnect</param>
        /// <returns></returns>
        protected async Task PublishParticipantStatusMessage(ParticipantState participantState,
            ParticipantStatus newStatus, string reason)
        {
            SourceConference.UpdateParticipantStatus(SourceParticipant, newStatus);
            await conferenceService.UpdateConferenceAsync(SourceConference);
            foreach (var username in SourceConference.Participants.Select(x => x.Username.ToLowerInvariant()))
            {
                await HubContext.Clients.Group(username)
                    .ParticipantStatusMessage(SourceParticipant.Id, SourceParticipant.Username, SourceConference.Id,
                        participantState, reason);
                Logger.LogInformingParticipantStatus(username, SourceConference.Id, SourceParticipant.Id, SourceParticipant.Role.ToString(), participantState.ToString());
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ParticipantStatusMessage(SourceParticipant.Id, SourceParticipant.Username, SourceConference.Id,
                    participantState, reason);
            Logger.LogInformingAdminParticipantStatus(SourceConference.Id, SourceParticipant.Id, SourceParticipant.Role.ToString(), participantState.ToString());
        }

        /// <summary>
        ///     Publish a hearing event to all participants in conference to those connected to the HubContext
        /// </summary>
        /// <param name="hearingEventStatus">Hearing status event to publish</param>
        /// <returns></returns>
        protected async Task PublishConferenceStatusMessage(ConferenceStatus hearingEventStatus)
        {
            SourceConference.UpdateConferenceStatus(hearingEventStatus);
            if (hearingEventStatus == ConferenceStatus.Closed)
                SourceConference.UpdateClosedDateTime(DateTime.UtcNow);
            await conferenceService.UpdateConferenceAsync(SourceConference);
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant()).ConferenceStatusMessage(SourceConference.Id, hearingEventStatus);
                Logger.LogConferenceStatus(SourceConference.Id, participant.Id, participant.Role.ToString(), hearingEventStatus.ToString());
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ConferenceStatusMessage(SourceConference.Id, hearingEventStatus);
        }

        protected async Task PublishEndpointStatusMessage(EndpointState endpointState, EndpointStatus newStatus)
        {
            SourceConference.UpdateEndpointStatus(SourceEndpoint, newStatus);
            await conferenceService.UpdateConferenceAsync(SourceConference);
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .EndpointStatusMessage(SourceEndpoint.Id, SourceConference.Id, endpointState);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .EndpointStatusMessage(SourceEndpoint.Id, SourceConference.Id, endpointState);
            Logger.LogEndpointStatus(SourceEndpoint.Id, endpointState.ToString());
        }

        protected async Task PublishRoomTransferMessage(RoomTransfer roomTransfer)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant()).RoomTransfer(roomTransfer);
                Logger.LogRoomTransferToGroup(participant.Username, participant.Role.ToString());
            }

            await UpdateConsultationRoom(roomTransfer);

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .RoomTransfer(roomTransfer);
            Logger.LogRoomTransferToAdminGroup(Hub.EventHub.VhOfficersGroupName);
        }

        private async Task UpdateConsultationRoom(RoomTransfer roomTransfer)
        {
            var participantToTransfer = SourceConference.Participants.Find(p => p.Id == roomTransfer.ParticipantId);
            var endpointToTransfer = SourceConference.Endpoints.Find(e => e.Id == roomTransfer.ParticipantId);
            
            if (participantToTransfer != null)
            {
                UpdateConsultationRoomForParticipant(participantToTransfer, roomTransfer.ToRoom, roomTransfer.FromRoom);
            }
            if (endpointToTransfer != null)
            {
                UpdateConsultationRoomForEndpoint(endpointToTransfer, roomTransfer.ToRoom, roomTransfer.FromRoom);
            }
            
            await conferenceService.UpdateConferenceAsync(SourceConference);
        }

        private void UpdateConsultationRoomForParticipant(Participant participant, string toRoom, string fromRoom)
        {
            var isToConsultationRoom = IsToConsultationRoom(toRoom);
            if (isToConsultationRoom)
            {
                SourceConference.AddParticipantToConsultationRoom(toRoom, participant);
            }
            else
            {
                SourceConference.RemoveParticipantFromConsultationRoom(participant, fromRoom);
            }
        }

        private void UpdateConsultationRoomForEndpoint(Endpoint endpoint, string toRoom, string fromRoom)
        {
            var isToConsultationRoom = IsToConsultationRoom(toRoom);
            if (isToConsultationRoom)
            {
                SourceConference.AddEndpointToConsultationRoom(toRoom, endpoint);
            }
            else
            {
                SourceConference.RemoveEndpointFromConsultationRoom(endpoint, fromRoom);
            }
        }

        private static bool IsToConsultationRoom(string toRoom) => toRoom.Contains("consultation", StringComparison.CurrentCultureIgnoreCase);

        protected abstract Task PublishStatusAsync(CallbackEvent callbackEvent);
    }
}
