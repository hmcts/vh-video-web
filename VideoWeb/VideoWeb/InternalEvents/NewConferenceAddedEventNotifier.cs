using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.InternalEvents.Interfaces;

namespace VideoWeb.InternalEvents
{
    public class NewConferenceAddedEventNotifier : INewConferenceAddedEventNotifier
    {
        private readonly IEventHandlerFactory _eventHandlerFactory;
        private readonly ILogger<NewConferenceAddedEventNotifier> _logger;

        public NewConferenceAddedEventNotifier(IEventHandlerFactory eventHandlerFactory, ILogger<NewConferenceAddedEventNotifier> logger)
        {
            _eventHandlerFactory = eventHandlerFactory;
            _logger = logger;
        }

        public Task PushNewConferenceAddedEvent(Guid conferenceId)
        {
            var callbackEvent = new CallbackEvent
            {
                ConferenceId = conferenceId,
                EventType = EventType.NewConferenceAdded,
                TimeStampUtc = DateTime.Now
            };

            var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
            return handler.HandleAsync(callbackEvent);
        }
    }
}
