using System.Linq;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.EventHub.Mappers
{
    public interface IHeartbeatMapper
    {
        AddHeartbeatRequest MapToRequest(Heartbeat heartbeat);
        HeartbeatHealth MapToHealth(Heartbeat heartbeat);
    }

    public class HeartbeatMapper : IHeartbeatMapper
    {
        public AddHeartbeatRequest MapToRequest(Heartbeat heartbeat)
        {
            throw new HeartbeatException($"Unable to map to {nameof(AddHeartbeatRequest)}");
        }

        public HeartbeatHealth MapToHealth(Heartbeat heartbeat)
        {
            if (!heartbeat.IncomingAudioPercentageLostRecent.HasValue)
            {
                
            }
            
            var max = new[]
            {
                heartbeat.IncomingAudioPercentageLostRecent,
                heartbeat.IncomingVideoPercentageLostRecent,
                heartbeat.OutgoingAudioPercentageLostRecent,
                heartbeat.OutgoingVideoPercentageLostRecent,
            }.Max();

            return HeartbeatHealth.Good;
        }
    }
}
