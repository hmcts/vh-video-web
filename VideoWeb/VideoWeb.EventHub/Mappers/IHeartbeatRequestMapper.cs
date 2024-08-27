using VideoWeb.EventHub.Enums;
using VideoApi.Contract.Requests;

namespace VideoWeb.EventHub.Mappers
{
    public interface IHeartbeatRequestMapper
    {
        AddHeartbeatRequest MapToRequest(Heartbeat heartbeat);
        HeartbeatHealth MapToHealth(Heartbeat heartbeat);
    }
}
