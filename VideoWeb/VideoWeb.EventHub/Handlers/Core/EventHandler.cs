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
}
