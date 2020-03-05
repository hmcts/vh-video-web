using System.Linq;
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

    public class HeartbeatMapper : IHeartbeatMapper
    {
        public AddHeartbeatRequest MapToRequest(Heartbeat heartbeat)
        {
            return new AddHeartbeatRequest
            {
                Incoming_audio_percentage_lost = decimal.ToDouble(heartbeat.IncomingAudioPercentageLost),
                Incoming_audio_percentage_lost_recent = decimal.ToDouble(heartbeat.IncomingAudioPercentageLostRecent),
                Incoming_video_percentage_lost = decimal.ToDouble(heartbeat.IncomingVideoPercentageLost),
                Incoming_video_percentage_lost_recent = decimal.ToDouble(heartbeat.IncomingVideoPercentageLostRecent),
                Outgoing_audio_percentage_lost = decimal.ToDouble(heartbeat.OutgoingAudioPercentageLost),
                Outgoing_audio_percentage_lost_recent = decimal.ToDouble(heartbeat.OutgoingAudioPercentageLostRecent),
                Outgoing_video_percentage_lost = decimal.ToDouble(heartbeat.OutgoingVideoPercentageLost),
                Outgoing_video_percentage_lost_recent = decimal.ToDouble(heartbeat.OutgoingVideoPercentageLostRecent),
                Browser_name = heartbeat.BrowserName,
                Browser_version = heartbeat.BrowserVersion,
            };
        }

        public HeartbeatHealth MapToHealth(Heartbeat heartbeat)
        {
            var max = new[]
            {
                heartbeat.IncomingAudioPercentageLostRecent,
                heartbeat.IncomingVideoPercentageLostRecent,
                heartbeat.OutgoingAudioPercentageLostRecent,
                heartbeat.OutgoingVideoPercentageLostRecent,
            }.Max();

            return max < 10m ? HeartbeatHealth.Good : max >= 15m ? HeartbeatHealth.Bad : HeartbeatHealth.Poor;
        }
    }
}
