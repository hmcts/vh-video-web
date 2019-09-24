using System.Threading.Tasks;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers.Core
{
    public interface IEventHandler
    {
        EventType EventType { get; }
        Task HandleAsync(CallbackEvent callbackEvent);
    }

    public abstract class EventHandler : IEventHandler
    {
        public abstract EventType EventType { get; }
        public abstract Task HandleAsync(CallbackEvent callbackEvent);
    }
}