using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Mappers
{
    public interface IHeartbeatRequestMapper
    {
        AddHeartbeatRequest MapToRequest(Heartbeat heartbeat);
        HeartbeatHealth MapToHealth(Heartbeat heartbeat);
    }
}
