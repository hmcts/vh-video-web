using System.Threading.Tasks;

namespace VideoWeb.InternalEvents.Core;

public interface IInternalEventHandler
{
    void HandleAsync(object internalEvent);
}

public interface IInternalEventHandler<in T> where T : IInternalEvent
{
    Task Handle(T internalEvent);
}
