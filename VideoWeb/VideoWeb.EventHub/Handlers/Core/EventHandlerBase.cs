using System;
using System.Linq;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using EndpointState = VideoWeb.EventHub.Enums.EndpointState;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;
using Task = System.Threading.Tasks.Task;

namespace VideoWeb.EventHub.Handlers.Core
{
    public abstract class EventHandlerBase : IEventHandler
    {
        protected readonly IHubContext<Hub.EventHub, IEventHubClient> HubContext;
        protected readonly ILogger<EventHandlerBase> Logger;
        private readonly IConferenceService _conferenceService;

        protected Conference SourceConference { get; set; }
        public Participant SourceParticipant { get; set; }
        protected Endpoint SourceEndpoint { get; set; }

        public abstract EventType EventType { get; }

        protected EventHandlerBase(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceService conferenceService,
            ILogger<EventHandlerBase> logger)
        {
            HubContext = hubContext;
            _conferenceService = conferenceService;
            Logger = logger;
        }

        public virtual async Task HandleAsync(CallbackEvent callbackEvent)
        {
            SourceConference = await _conferenceService.GetConference(callbackEvent.ConferenceId);
            if (SourceConference == null)
                throw new ConferenceNotFoundException(callbackEvent.ConferenceId);

            SourceParticipant = SourceConference.Participants
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);
            SourceEndpoint = SourceConference.Endpoints
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);

            Logger.LogTrace("Handling Event: {EventType} for conferenceId {ConferenceId} with reason {Reason}",
                callbackEvent.EventType, callbackEvent.ConferenceId, callbackEvent.Reason);

            await PublishStatusAsync(callbackEvent);
        }

        /// <summary>
        ///     Publish a participant event to all participants in conference to those connected to the HubContext
        /// </summary>
        /// <param name="participantState">Participant status event to publish</param>
        /// <param name="newStatus"></param>
        /// <returns></returns>
        protected async Task PublishParticipantStatusMessage(ParticipantState participantState, ParticipantStatus newStatus)
        {
            SourceConference.UpdateParticipantStatus(SourceParticipant, newStatus);
            await _conferenceService.UpdateConferenceAsync(SourceConference);

            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .ParticipantStatusMessage(SourceParticipant.Id, SourceParticipant.Username, SourceConference.Id,
                        participantState);
                Logger.LogTrace(
                    "Informing {Username} in conference {ConferenceId} Participant Status: Participant Id: {ParticipantId} | Role: {ParticipantRole} | Participant State: {ParticipantState}",
                    participant.Username.ToLowerInvariant(), SourceConference.Id, SourceParticipant.Id,
                    SourceParticipant.Role, participantState);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ParticipantStatusMessage(SourceParticipant.Id, SourceParticipant.Username, SourceConference.Id,
                    participantState);
            Logger.LogTrace(
                "Informing Admin for conference {ConferenceId} Participant Status: Participant Id: {ParticipantId} | Role: {ParticipantRole} | Participant State: {ParticipantState}",
                SourceConference.Id, SourceParticipant.Id, SourceParticipant.Role, participantState);
        }

        /// <summary>
        ///     Publish a hearing event to all participants in conference to those connected to the HubContext
        /// </summary>
        /// <param name="hearingEventStatus">Hearing status event to publish</param>
        /// <returns></returns>
        protected async Task PublishConferenceStatusMessage(ConferenceStatus hearingEventStatus)
        {
            SourceConference.UpdateConferenceStatus(hearingEventStatus);
            await _conferenceService.UpdateConferenceAsync(SourceConference);

            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant()).ConferenceStatusMessage(SourceConference.Id, hearingEventStatus);
                Logger.LogTrace(
                    "Conference Status: Conference Id: {SourceConferenceId} | Participant Id: {ParticipantId} | Role: {ParticipantRole} | Participant State: {HearingEventStatus}",
                    SourceConference.Id, participant.Id, participant.Role, hearingEventStatus);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ConferenceStatusMessage(SourceConference.Id, hearingEventStatus);
        }

        protected async Task PublishEndpointStatusMessage(EndpointState endpointState, EndpointStatus newStatus)
        {
            SourceConference.UpdateEndpointStatus(SourceEndpoint, newStatus);
            await _conferenceService.UpdateConferenceAsync(SourceConference);

            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .EndpointStatusMessage(SourceEndpoint.Id, SourceConference.Id, endpointState);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .EndpointStatusMessage(SourceEndpoint.Id, SourceConference.Id, endpointState);

            Logger.LogTrace("Endpoint Status: Endpoint Id: {SourceEndpointId} | Endpoint State: {EndpointState}",
                SourceEndpoint.Id, endpointState);
        }

        protected async Task PublishRoomTransferMessage(RoomTransfer roomTransfer)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant()).RoomTransfer(roomTransfer);
                Logger.LogTrace("RoomTransfer sent to group: {Group} | Role: {ParticipantRole}", participant.Username,
                    participant.Role);
            }

            await UpdateConsultationRoom(roomTransfer);

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .RoomTransfer(roomTransfer);
            Logger.LogTrace("RoomTransfer sent to group: {Group}", Hub.EventHub.VhOfficersGroupName);
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

            await _conferenceService.UpdateConferenceAsync(SourceConference);
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
