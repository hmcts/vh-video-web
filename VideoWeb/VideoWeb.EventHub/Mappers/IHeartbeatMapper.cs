using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.EventHub.Mappers
{
    public interface IHeartbeatMapper
    {
        AddHeartbeatRequest MapToRequest(Heartbeat heartbeat);
        HeartbeatHealth MapToHealth(Heartbeat heartbeat);
    }
}
