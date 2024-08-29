using System;
using System.Threading.Tasks;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Helpers
{
    public class HearingCancelledEventNotifier(IEventHandlerFactory eventHandlerFactory) : IHearingCancelledEventNotifier
    {
        public Task PushHearingCancelledEvent(Guid conferenceId)
        {
            var callbackEvent = new CallbackEvent
            {
                ConferenceId = conferenceId,
                EventType = EventType.HearingCancelled,
                TimeStampUtc = DateTime.Now
            };

            var handler = eventHandlerFactory.Get(callbackEvent.EventType);
            return handler.HandleAsync(callbackEvent);
        }
    }
}
