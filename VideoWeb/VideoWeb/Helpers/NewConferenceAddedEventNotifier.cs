using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;

namespace VideoWeb.Helpers
{
    public class NewConferenceAddedEventNotifier : INewConferenceAddedEventNotifier
    {
        private readonly IEventHandlerFactory _eventHandlerFactory;

        public NewConferenceAddedEventNotifier(IEventHandlerFactory eventHandlerFactory, ILogger<NewConferenceAddedEventNotifier> logger)
        {
            _eventHandlerFactory = eventHandlerFactory;
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
