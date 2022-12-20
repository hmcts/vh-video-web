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
                IncomingAudioPercentageLost = heartbeat.IncomingAudioPercentageLost,
                IncomingAudioPercentageLostRecent = heartbeat.IncomingAudioPercentageLostRecent,
                IncomingVideoPercentageLost = heartbeat.IncomingVideoPercentageLost,
                IncomingVideoPercentageLostRecent = heartbeat.IncomingVideoPercentageLostRecent,
                OutgoingAudioPercentageLost = heartbeat.OutgoingAudioPercentageLost,
                OutgoingAudioPercentageLostRecent = heartbeat.OutgoingAudioPercentageLostRecent,
                OutgoingVideoPercentageLost = heartbeat.OutgoingVideoPercentageLost,
                OutgoingVideoPercentageLostRecent = heartbeat.OutgoingVideoPercentageLostRecent,
                BrowserName = heartbeat.BrowserName,
                Device = heartbeat.Device,
                BrowserVersion = heartbeat.BrowserVersion,
                OperatingSystem = heartbeat.OperatingSystem,
                OperatingSystemVersion = heartbeat.OperatingSystemVersion,
                OutgoingAudioPacketsLost = heartbeat.OutgoingAudioPacketsLost,
                OutgoingAudioBitrate = heartbeat.OutgoingAudioBitrate,
                OutgoingAudioCodec = heartbeat.OutgoingAudioCodec,
                OutgoingAudioPacketSent = heartbeat.OutgoingAudioPacketSent,
                OutgoingVideoPacketSent = heartbeat.OutgoingVideoPacketSent,
                OutgoingVideoPacketsLost = heartbeat.OutgoingVideoPacketsLost,
                OutgoingVideoFramerate = heartbeat.OutgoingVideoFramerate,
                OutgoingVideoBitrate = heartbeat.OutgoingVideoBitrate,
                OutgoingVideoCodec = heartbeat.OutgoingVideoCodec,
                OutgoingVideoResolution = heartbeat.OutgoingVideoResolution,
                IncomingAudioBitrate = heartbeat.IncomingAudioBitrate,
                IncomingAudioCodec = heartbeat.IncomingAudioCodec,
                IncomingAudioPacketReceived = heartbeat.IncomingAudioPacketReceived,
                IncomingAudioPacketsLost = heartbeat.IncomingAudioPacketsLost,
                IncomingVideoBitrate = heartbeat.IncomingVideoBitrate,
                IncomingVideoCodec = heartbeat.IncomingVideoCodec,
                IncomingVideoResolution = heartbeat.IncomingVideoResolution,
                IncomingVideoPacketReceived = heartbeat.IncomingVideoPacketReceived,
                IncomingVideoPacketsLost = heartbeat.IncomingVideoPacketsLost
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
