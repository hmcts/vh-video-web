using System.Linq;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Requests;

namespace VideoWeb.EventHub.Mappers
{
    public class HeartbeatRequestMapper : IHeartbeatRequestMapper
    {
        public AddHeartbeatRequest MapToRequest(Heartbeat heartbeat)
        {
            return new AddHeartbeatRequest
            {
                Incoming_audio_percentage_lost = heartbeat.IncomingAudioPercentageLost,
                Incoming_audio_percentage_lost_recent = heartbeat.IncomingAudioPercentageLostRecent,
                Incoming_video_percentage_lost = heartbeat.IncomingVideoPercentageLost,
                Incoming_video_percentage_lost_recent = heartbeat.IncomingVideoPercentageLostRecent,
                Outgoing_audio_percentage_lost = heartbeat.OutgoingAudioPercentageLost,
                Outgoing_audio_percentage_lost_recent = heartbeat.OutgoingAudioPercentageLostRecent,
                Outgoing_video_percentage_lost = heartbeat.OutgoingVideoPercentageLost,
                Outgoing_video_percentage_lost_recent = heartbeat.OutgoingVideoPercentageLostRecent,
                Browser_name = heartbeat.BrowserName,
                Browser_version = heartbeat.BrowserVersion,
                Operating_system = heartbeat.OperatingSystem,
                Operating_system_version = heartbeat.OperatingSystemVersion
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
