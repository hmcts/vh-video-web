using System;
using System.Threading.Tasks;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Helpers
{
    public class HearingDetailsUpdatedEventNotifier(IEventHandlerFactory eventHandlerFactory) : IHearingDetailsUpdatedEventNotifier
    {
        public Task PushHearingDetailsUpdatedEvent(Guid hearingId)
        {
            var callbackEvent = new CallbackEvent
            {
                HearingId = hearingId,
                EventType = EventType.HearingDetailsUpdated,
                TimeStampUtc = DateTime.Now
            };

            var handler = eventHandlerFactory.Get(callbackEvent.EventType);
            return handler.HandleAsync(callbackEvent);
        }
    }
}
