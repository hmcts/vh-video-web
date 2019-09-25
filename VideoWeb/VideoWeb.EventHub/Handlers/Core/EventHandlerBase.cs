using System.Linq;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using Task = System.Threading.Tasks.Task;

namespace VideoWeb.EventHub.Handlers.Core
{
    public abstract class EventHandlerBase : IEventHandler
    {
        protected readonly IHubContext<Hub.EventHub, IEventHubClient> HubContext;
        private readonly IMemoryCache _memoryCache;

        protected EventHandlerBase(IHubContext<Hub.EventHub, IEventHubClient> hubContext, IMemoryCache memoryCache)
        {
            HubContext = hubContext;
            _memoryCache = memoryCache;
        }

        public Conference SourceConference { get; set; }
        public Participant SourceParticipant { get; set; }

        public abstract EventType EventType { get; }

        public async Task HandleAsync(CallbackEvent callbackEvent)
        {
            SourceConference = _memoryCache.Get<Conference>(callbackEvent.ConferenceId);
            if (SourceConference == null) throw new ConferenceNotFoundException(callbackEvent.ConferenceId);

            SourceParticipant = SourceConference.Participants
                .SingleOrDefault(x => x.Id == callbackEvent.ParticipantId);

            await PublishStatusAsync(callbackEvent);
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
                await HubContext.Clients.Group(participant.UserId.ToLowerInvariant())
                    .ParticipantStatusMessage(SourceParticipant.UserId, participantState);
            }
            
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ParticipantStatusMessage(SourceParticipant.UserId, participantState);
        }

        /// <summary>
        ///     Publish a hearing event to all participants in conference to those connected to the HubContext
        /// </summary>
        /// <param name="hearingEventStatus">Hearing status event to publish</param>
        /// <returns></returns>
        protected async Task PublishConferenceStatusMessage(ConferenceState hearingEventStatus)
        {
            foreach (var participant in SourceConference.Participants)
            {
                await HubContext.Clients.Group(participant.UserId.ToLowerInvariant())
                    .ConferenceStatusMessage(SourceConference.Id, hearingEventStatus);
            }
            await HubContext.Clients.Group(Hub.EventHub.VhOfficersGroupName)
                .ConferenceStatusMessage(SourceConference.Id, hearingEventStatus);
        }

        protected abstract Task PublishStatusAsync(CallbackEvent callbackEvent);
    }
}