using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;
using Task = System.Threading.Tasks.Task;

namespace VideoWeb.EventHub.Handlers.Core
{
    public abstract class EventHandlerBase : IEventHandler
    {
        protected readonly IHubContext<Hub.EventHub, IEventHubClient> HubContext;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<EventHandlerBase> _logger;
        private readonly IVideoApiClient _videoApiClient;

        protected EventHandlerBase(IHubContext<Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<EventHandlerBase> logger, IVideoApiClient videoApiClient)
        {
            HubContext = hubContext;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _videoApiClient = videoApiClient;
        }

        public Conference SourceConference { get; set; }
        public Participant SourceParticipant { get; set; }

        public abstract EventType EventType { get; }

        public async Task HandleAsync(CallbackEvent callbackEvent)
        {
            SourceConference = await GetConference(callbackEvent.ConferenceId);
            if (SourceConference == null) throw new ConferenceNotFoundException(callbackEvent.ConferenceId);

            SourceParticipant = SourceConference.Participants
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);

            _logger.LogTrace($"Handling Event: {callbackEvent.EventType} for conferenceId {callbackEvent.ConferenceId} with reason " +
                $"{callbackEvent.Reason} at Timestamp: { (DateTime.Now) :yyyy-MM-dd HH:mm:ss.fffffff}");
            await PublishStatusAsync(callbackEvent);
        }

        private async Task<Conference> GetConference(Guid conferenceId)
        {
            var conference = await _conferenceCache.GetConferenceAsync(conferenceId);
            if (conference != null) return conference;
            var conferenceDetail = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            await _conferenceCache.AddConferenceAsync(conferenceDetail);

            return await _conferenceCache.GetConferenceAsync(conferenceId);

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
                _logger.LogTrace($"Participant Status: Participant Id: { participant.Id } | " +
                    $"Role: { participant.Role } | Participant State: { participantState } | Timestamp: { (DateTime.Now).ToString("yyyy-MM-dd HH:mm:ss.fffffff") } ");
            }
            
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ParticipantStatusMessage(SourceParticipant.Id, SourceParticipant.Username, SourceConference.Id, participantState);
            _logger.LogTrace($"Participant Status: Participant Id: { SourceParticipant.Id } | " +
                $"Role: { SourceParticipant.Role } | Participant State: { participantState } | Timestamp: { (DateTime.Now).ToString("yyyy-MM-dd HH:mm:ss.fffffff") } ");
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
                _logger.LogTrace($"Conference Status: Conference Id: { SourceConference.Id } | Participant Id: { participant.Id } | " +
                    $"Role: { participant.Role } | Participant State: { hearingEventStatus } | Timestamp: { (DateTime.Now).ToString("yyyy-MM-dd HH:mm:ss.fffffff") } ");
            }
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ConferenceStatusMessage(SourceConference.Id, hearingEventStatus);
        }

        protected abstract Task PublishStatusAsync(CallbackEvent callbackEvent);
    }
}
