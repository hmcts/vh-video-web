using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoWeb.Common.Caching;
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
    public abstract class EventHandlerBase : IEventHandler
    {
        protected readonly IHubContext<Hub.EventHub, IEventHubClient> HubContext;
        protected readonly ILogger<EventHandlerBase> Logger;
        private readonly IConferenceCache _conferenceCache;
        private readonly IVideoApiClient _videoApiClient;

        protected EventHandlerBase(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient)
        {
            HubContext = hubContext;
            _conferenceCache = conferenceCache;
            Logger = logger;
            _videoApiClient = videoApiClient;
        }

        public Conference SourceConference { get; set; }
        public Participant SourceParticipant { get; set; }
        public Endpoint SourceEndpoint { get; set; }

        public abstract EventType EventType { get; }

        public async Task HandleAsync(CallbackEvent callbackEvent)
        {
            SourceConference = await GetConference(callbackEvent.ConferenceId);
            if (SourceConference == null) throw new ConferenceNotFoundException(callbackEvent.ConferenceId);

            SourceParticipant = SourceConference.Participants
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);

            SourceEndpoint = SourceConference.Endpoints
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);
            
            Logger.LogTrace("Handling Event: {EventType} for conferenceId {ConferenceId} with reason {Reason}",
                callbackEvent.EventType, callbackEvent.ConferenceId, callbackEvent.Reason);
            await PublishStatusAsync(callbackEvent);
        }

        private async Task<Conference> GetConference(Guid conferenceId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
            return conference;
        }

        /// <summary>
        ///     Publish a participant event to all participants in conference to those connected to the HubContext
        /// </summary>
        /// <param name="participantState">Participant status event to publish</param>
        /// <returns></returns>
        protected async Task PublishParticipantStatusMessage(ParticipantState participantState)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .ParticipantStatusMessage(SourceParticipant.Id, SourceParticipant.Username, SourceConference.Id, participantState);
                Logger.LogTrace("Participant Status: Participant Id: { participantId } | Role: { participantRole } | Participant State: { participantState }",
                    participant.Id, participant.Role, participantState);
            }
            
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ParticipantStatusMessage(SourceParticipant.Id, SourceParticipant.Username, SourceConference.Id, participantState);
            Logger.LogTrace("Participant Status: Participant Id: { participantId } | Role: { participantRole } | Participant State: { participantState }",
                SourceParticipant.Id, SourceParticipant.Role, participantState);
        }

        /// <summary>
        ///     Publish a hearing event to all participants in conference to those connected to the HubContext
        /// </summary>
        /// <param name="hearingEventStatus">Hearing status event to publish</param>
        /// <returns></returns>
        protected async Task PublishConferenceStatusMessage(ConferenceStatus hearingEventStatus)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .ConferenceStatusMessage(SourceConference.Id, hearingEventStatus);
                Logger.LogTrace("Conference Status: Conference Id: { SourceConferenceId } | Participant Id: { participantId } | Role: { participantRole } | Participant State: { hearingEventStatus }",
                    SourceConference.Id, participant.Id, participant.Role, hearingEventStatus);
            }
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ConferenceStatusMessage(SourceConference.Id, hearingEventStatus);
        }
        
        protected async Task PublishEndpointStatusMessage(EndpointState endpointState)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .EndpointStatusMessage(SourceEndpoint.Id,  SourceConference.Id, endpointState);
            }
            
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .EndpointStatusMessage(SourceEndpoint.Id,  SourceConference.Id, endpointState);
            Logger.LogTrace("Endpoint Status: Endpoint Id: { SourceEndpointId } | Endpoint State: { endpointState }",
                SourceEndpoint.Id, endpointState);
        }

        protected async Task PublishRoomTransferMessage(RoomTransfer roomTransfer)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                    .RoomTransfer(roomTransfer);
                Logger.LogTrace("RoomTransfer sent to group: {group} | Role: { participantRole }", participant.Username, participant.Role);
            }
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .RoomTransfer(roomTransfer);
            Logger.LogTrace("RoomTransfer sent to group: {group}", Hub.EventHub.VhOfficersGroupName);
        }

        protected abstract Task PublishStatusAsync(CallbackEvent callbackEvent);
    }
}
