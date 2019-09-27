using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Handlers.Core
{
    public interface IEventHandlerFactory
    {
        IEventHandler Get(EventType eventType);
    }

    public class EventHandlerFactory : IEventHandlerFactory
    {
        private readonly IEnumerable<IEventHandler> _eventHandlers;

        public EventHandlerFactory(IEnumerable<IEventHandler> eventHandlers)
        {
            _eventHandlers = eventHandlers;
        }

        public IEventHandler Get(EventType eventType)
        {
            var eventHandler = _eventHandlers.SingleOrDefault(x => x.EventType == eventType);
            if (eventHandler == null)
                throw new ArgumentOutOfRangeException(nameof(eventType),
                    $"EventHandler cannot be found for eventType: {eventType.ToString()}");
            return eventHandler;
        }
    }
}