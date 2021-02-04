using System.Linq;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Mappers
{
    public class HeartbeatRequestMapper : IHeartbeatRequestMapper
    {
        public AddHeartbeatRequest MapToRequest(Heartbeat heartbeat)
        {
            return new AddHeartbeatRequest
            {
                IncomingAudioPercentageLost = heartbeat.IncomingAudioPercentageLost,
                IncomingAudioPercentageLostRecent = heartbeat.IncomingAudioPercentageLostRecent,
                IncomingVideoPercentageLost = heartbeat.IncomingVideoPercentageLost,
                IncomingVideoPercentageLostRecent = heartbeat.IncomingVideoPercentageLostRecent,
                OutgoingAudioPercentageLost = heartbeat.OutgoingAudioPercentageLost,
                OutgoingAudioPercentageLostRecent = heartbeat.OutgoingAudioPercentageLostRecent,
                OutgoingVideoPercentageLost = heartbeat.OutgoingVideoPercentageLost,
                OutgoingVideoPercentageLostRecent = heartbeat.OutgoingVideoPercentageLostRecent,
                BrowserName = heartbeat.BrowserName,
                BrowserVersion = heartbeat.BrowserVersion,
                OperatingSystem = heartbeat.OperatingSystem,
                OperatingSystemVersion = heartbeat.OperatingSystemVersion
            };
        }

        public HeartbeatHealth MapToHealth(Heartbeat heartbeat)
        {
            var max = new[]
            {
                heartbeat.IncomingAudioPercentageLostRecent,
                heartbeat.IncomingVideoPercentageLostRecent,
                heartbeat.OutgoingAudioPercentageLostRecent,
                heartbeat.OutgoingVideoPercentageLostRecent
            }.Max();

            if (max < 10m)
            {
                return HeartbeatHealth.Good;
            }

            return max >= 15m ? HeartbeatHealth.Bad : HeartbeatHealth.Poor;
        }
    }
}
