using System.Threading.Tasks;

namespace VideoWeb.EventHub.InternalHandlers.Core
{
    public interface IInternalEventHandler
    {
        Task HandleAsync(object eventPayload);
    }
    
    public interface IInternalEventHandler<in T> : IInternalEventHandler where T : IInternalEventPayload
    {
        Task HandleAsync(T eventPayload);
    }
}
