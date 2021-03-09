using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Requests;

namespace VideoWeb.EventHub.Mappers
{
    public interface IHeartbeatRequestMapper
    {
        AddHeartbeatRequest MapToRequest(Heartbeat heartbeat);
        HeartbeatHealth MapToHealth(Heartbeat heartbeat);
    }
}
