using System.Text.Json.Serialization;

namespace VideoWeb.EventHub.Models
{
    public class Heartbeat
    {
        [JsonPropertyName("outgoingAudioPercentageLost")]
        public decimal OutgoingAudioPercentageLost { get; set; }
        [JsonPropertyName("outgoingAudioPercentageLostRecent")]
        public decimal OutgoingAudioPercentageLostRecent { get; set; }
        [JsonPropertyName("incomingAudioPercentageLost")]
        public decimal IncomingAudioPercentageLost { get; set; }
        [JsonPropertyName("incomingAudioPercentageLostRecent")]
        public decimal IncomingAudioPercentageLostRecent { get; set; }
        [JsonPropertyName("outgoingVideoPercentageLost")]
        public decimal OutgoingVideoPercentageLost { get; set; }
        [JsonPropertyName("outgoingVideoPercentageLostRecent")]
        public decimal OutgoingVideoPercentageLostRecent { get; set; }
        [JsonPropertyName("incomingVideoPercentageLost")]
        public decimal IncomingVideoPercentageLost { get; set; }
        [JsonPropertyName("incomingVideoPercentageLostRecent")]
        public decimal IncomingVideoPercentageLostRecent { get; set; }
        [JsonPropertyName("browserName")]
        public string BrowserName { get; set; }
        [JsonPropertyName("browserVersion")]
        public string BrowserVersion { get; set; }
        [JsonPropertyName("operatingSystem")]
        public string OperatingSystem { get; set; }
        [JsonPropertyName("operatingSystemVersion")]
        public string OperatingSystemVersion { get; set; }
        [JsonPropertyName("outgoingAudioPacketsLost")]
        public int OutgoingAudioPacketsLost { get; set; }
        [JsonPropertyName("outgoingAudioBitrate")]
        public string OutgoingAudioBitrate { get; set; }
        [JsonPropertyName("outgoingAudioCodec")]
        public string OutgoingAudioCodec { get; set; }
        [JsonPropertyName("outgoingAudioPacketSent")]
        public int OutgoingAudioPacketSent { get; set; }
        [JsonPropertyName("outgoingVideoPacketSent")]
        public int OutgoingVideoPacketSent { get; set; }
        [JsonPropertyName("outgoingVideoPacketsLost")]
        public int OutgoingVideoPacketsLost { get; set; }
        [JsonPropertyName("outgoingVideoFramerate")]
        public int OutgoingVideoFramerate { get; set; }
        [JsonPropertyName("outgoingVideoBitrate")]
        public string OutgoingVideoBitrate { get; set; }
        [JsonPropertyName("outgoingVideoCodec")]
        public string OutgoingVideoCodec { get; set; }
        [JsonPropertyName("outgoingVideoResolution")]
        public string OutgoingVideoResolution { get; set; }
        [JsonPropertyName("incomingAudioBitrate")]
        public string IncomingAudioBitrate { get; set; }
        [JsonPropertyName("incomingAudioCodec")]
        public string IncomingAudioCodec { get; set; }
        [JsonPropertyName("incomingAudioPacketReceived")]
        public int IncomingAudioPacketReceived { get; set; }
        [JsonPropertyName("incomingAudioPacketsLost")]
        public int IncomingAudioPacketsLost { get; set; }
        [JsonPropertyName("incomingVideoBitrate")]
        public string IncomingVideoBitrate { get; set; }
        [JsonPropertyName("incomingVideoCodec")]
        public string IncomingVideoCodec { get; set; }
        [JsonPropertyName("incomingVideoResolution")]
        public string IncomingVideoResolution { get; set; }
        [JsonPropertyName("incomingVideoPacketReceived")]
        public int IncomingVideoPacketReceived { get; set; }
        [JsonPropertyName("incomingVideoPacketsLost")]
        public int IncomingVideoPacketsLost { get; set; }
        [JsonPropertyName(nameof(Device))]
        public string Device { get; set; }
    }
}
