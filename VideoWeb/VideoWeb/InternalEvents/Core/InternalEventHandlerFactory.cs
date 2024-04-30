using System;

namespace VideoWeb.InternalEvents.Core;

public interface IInternalEventHandlerFactory
{
    IInternalEventHandler Get<T>(T internalEvent) where T: IInternalEvent;
}

public class InternalEventHandlerFactory : IInternalEventHandlerFactory
{
    private readonly IServiceProvider _serviceProvider;
    
    public InternalEventHandlerFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }
    
    public IInternalEventHandler Get<T>(T internalEvent) where T : IInternalEvent
    {
        var genericType = typeof(IInternalEventHandler<>).MakeGenericType(internalEvent.GetType());
        var service = _serviceProvider.GetService(genericType);
        
        return (IInternalEventHandler) service;
    }
}
