using System.Threading.Tasks;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Handlers.Core
{
    public interface IEventHandler
    {
        EventType EventType { get; }
        Task HandleAsync(CallbackEvent callbackEvent);
    }
}
