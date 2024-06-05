using System.Linq;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
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
        protected readonly IHubContext<Hub.EventHub, IEventHubClient> HubContext = hubContext;
        protected readonly ILogger<EventHandlerBase> Logger = logger;
        
        protected ConferenceDto SourceConferenceDto { get; set; }
        public ParticipantDto SourceParticipantDto { get; set; }
        protected EndpointDto SourceEndpointDto { get; set; }

        public abstract EventType EventType { get; }

        public virtual async Task HandleAsync(CallbackEvent callbackEvent)
        {
            SourceConferenceDto = await conferenceService.GetConference(callbackEvent.ConferenceId);
            if (SourceConferenceDto == null) throw new ConferenceNotFoundException(callbackEvent.ConferenceId);
            SourceParticipantDto = SourceConferenceDto.Participants
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);
            SourceEndpointDto = SourceConferenceDto.Endpoints
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);

            Logger.LogTrace("Handling Event: {EventType} for conferenceId {ConferenceId} with reason {Reason}",
                callbackEvent.EventType, callbackEvent.ConferenceId, callbackEvent.Reason);

            await PublishStatusAsync(callbackEvent);
        }
        

        /// <summary>
        ///     Publish a participant event to all participants in conference to those connected to the HubContext
        /// </summary>
        /// <param name="participantState">Participant status event to publish</param>
        /// <returns></returns>
        protected async Task PublishParticipantStatusMessage(ParticipantState participantState)
        {
            foreach (var participant in SourceConferenceDto.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .ParticipantStatusMessage(SourceParticipantDto.Id, SourceParticipantDto.Username, SourceConferenceDto.Id,
                        participantState);
                Logger.LogTrace(
                    "Informing {Username} in conference {ConferenceId} Participant Status: Participant Id: {ParticipantId} | Role: {ParticipantRole} | Participant State: {ParticipantState}",
                    participant.Username.ToLowerInvariant(), SourceConferenceDto.Id, SourceParticipantDto.Id,
                    SourceParticipantDto.Role, participantState);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ParticipantStatusMessage(SourceParticipantDto.Id, SourceParticipantDto.Username, SourceConferenceDto.Id,
                    participantState);
            Logger.LogTrace(
                "Informing Admin for conference {ConferenceId} Participant Status: Participant Id: {ParticipantId} | Role: {ParticipantRole} | Participant State: {ParticipantState}",
                SourceConferenceDto.Id, SourceParticipantDto.Id, SourceParticipantDto.Role, participantState);
        }

        /// <summary>
        ///     Publish a hearing event to all participants in conference to those connected to the HubContext
        /// </summary>
        /// <param name="hearingEventStatus">Hearing status event to publish</param>
        /// <returns></returns>
        protected async Task PublishConferenceStatusMessage(ConferenceStatus hearingEventStatus)
        {
            foreach (var participant in SourceConferenceDto.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .ConferenceStatusMessage(SourceConferenceDto.Id, hearingEventStatus);
                Logger.LogTrace(
                    "Conference Status: Conference Id: {SourceConferenceId} | Participant Id: {ParticipantId} | Role: {ParticipantRole} | Participant State: {HearingEventStatus}",
                    SourceConferenceDto.Id, participant.Id, participant.Role, hearingEventStatus);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ConferenceStatusMessage(SourceConferenceDto.Id, hearingEventStatus);
        }

        protected async Task PublishEndpointStatusMessage(EndpointState endpointState)
        {
            foreach (var participant in SourceConferenceDto.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .EndpointStatusMessage(SourceEndpointDto.Id, SourceConferenceDto.Id, endpointState);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .EndpointStatusMessage(SourceEndpointDto.Id, SourceConferenceDto.Id, endpointState);
            Logger.LogTrace("Endpoint Status: Endpoint Id: {SourceEndpointId} | Endpoint State: {EndpointState}",
                SourceEndpointDto.Id, endpointState);
        }

        protected async Task PublishRoomTransferMessage(RoomTransfer roomTransfer)
        {
            foreach (var participant in SourceConferenceDto.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .RoomTransfer(roomTransfer);
                Logger.LogTrace("RoomTransfer sent to group: {Group} | Role: {ParticipantRole}", participant.Username,
                    participant.Role);
            }

            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .RoomTransfer(roomTransfer);
            Logger.LogTrace("RoomTransfer sent to group: {Group}", Hub.EventHub.VhOfficersGroupName);
        }
        protected abstract Task PublishStatusAsync(CallbackEvent callbackEvent);
    }
}
