using System;
using System.Threading.Tasks;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Helpers
{
    public class HearingDateTimeChangedNotifier(IEventHandlerFactory eventHandlerFactory) : IHearingDateTimeChangedEventNotifier
    {
        public Task PushHearingDateTimeChangedEvent(Guid hearingId)
        {
            var callbackEvent = new CallbackEvent
            {
                HearingId = hearingId,
                EventType = EventType.HearingDateTimeChanged,
                TimeStampUtc = DateTime.Now
            };

            var handler = eventHandlerFactory.Get(callbackEvent.EventType);
            return handler.HandleAsync(callbackEvent);
        }
    }
}
