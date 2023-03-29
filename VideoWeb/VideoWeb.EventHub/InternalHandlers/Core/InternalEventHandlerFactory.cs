using System;

namespace VideoWeb.EventHub.InternalHandlers.Core
{
    public interface IInternalEventHandlerFactory
    {
        IInternalEventHandler Get<T>(T eventPayload) where T : IInternalEventPayload;
    }

    public class InternalEventHandlerFactory : IInternalEventHandlerFactory
    {
        private readonly IServiceProvider _serviceProvider;

        public InternalEventHandlerFactory(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }
        public IInternalEventHandler Get<T>(T eventPayload) where T : IInternalEventPayload
        {
            var genericType = typeof(IInternalEventHandler<>).MakeGenericType(eventPayload.GetType());
            var service = _serviceProvider.GetService(genericType);

            return (IInternalEventHandler)service;
        }
    }
}
