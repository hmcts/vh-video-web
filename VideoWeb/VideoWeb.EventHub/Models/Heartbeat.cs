using Newtonsoft.Json;

namespace VideoWeb.EventHub.Models
{
    public class Heartbeat
    {
        [JsonProperty("outgoingAudioPercentageLost")]
        public decimal OutgoingAudioPercentageLost { get; set; }
        [JsonProperty("outgoingAudioPercentageLostRecent")]
        public decimal OutgoingAudioPercentageLostRecent { get; set; }
        [JsonProperty("incomingAudioPercentageLost")]
        public decimal IncomingAudioPercentageLost { get; set; }
        [JsonProperty("incomingAudioPercentageLostRecent")]
        public decimal IncomingAudioPercentageLostRecent { get; set; }
        [JsonProperty("outgoingVideoPercentageLost")]
        public decimal OutgoingVideoPercentageLost { get; set; }
        [JsonProperty("outgoingVideoPercentageLostRecent")]
        public decimal OutgoingVideoPercentageLostRecent { get; set; }
        [JsonProperty("incomingVideoPercentageLost")]
        public decimal IncomingVideoPercentageLost { get; set; }
        [JsonProperty("incomingVideoPercentageLostRecent")]
        public decimal IncomingVideoPercentageLostRecent { get; set; }
        [JsonProperty("browserName")]
        public string BrowserName { get; set; }
        [JsonProperty("browserVersion")]
        public string BrowserVersion { get; set; }
        [JsonProperty("operatingSystem")]
        public string OperatingSystem { get; set; }
        [JsonProperty("operatingSystemVersion")]
        public string OperatingSystemVersion { get; set; }
        [JsonProperty("outgoingAudioPacketsLost")]
        public int OutgoingAudioPacketsLost { get; set; }
        [JsonProperty("outgoingAudioBitrate")]
        public string OutgoingAudioBitrate { get; set; }
        [JsonProperty("outgoingAudioCodec")] 
        public string OutgoingAudioCodec { get; set; }
        [JsonProperty("outgoingAudioPacketSent")] 
        public int OutgoingAudioPacketSent { get; set; }
        [JsonProperty("outgoingVideoPacketSent")] 
        public int OutgoingVideoPacketSent { get; set; }
        [JsonProperty("outgoingVideoPacketsLost")] 
        public int OutgoingVideoPacketsLost { get; set; }
        [JsonProperty("outgoingVideoFramerate")] 
        public int OutgoingVideoFramerate { get; set; }
        [JsonProperty("outgoingVideoBitrate")] 
        public string OutgoingVideoBitrate { get; set; }
        [JsonProperty("outgoingVideoCodec")] 
        public string OutgoingVideoCodec { get; set; }
        [JsonProperty("outgoingVideoResolution")] 
        public string OutgoingVideoResolution { get; set; }
        [JsonProperty("incomingAudioBitrate")] 
        public string IncomingAudioBitrate { get; set; }
        [JsonProperty("incomingAudioCodec")] 
        public string IncomingAudioCodec { get; set; }
        [JsonProperty("incomingAudioPacketReceived")] 
        public int IncomingAudioPacketReceived { get; set; }
        [JsonProperty("incomingAudioPacketsLost")] 
        public int IncomingAudioPacketsLost { get; set; }
        [JsonProperty("incomingVideoBitrate")] 
        public string IncomingVideoBitrate { get; set; }
        [JsonProperty("incomingVideoCodec")] 
        public string IncomingVideoCodec { get; set; }
        [JsonProperty("incomingVideoResolution")] 
        public string IncomingVideoResolution { get; set; }
        [JsonProperty("incomingVideoPacketReceived")] 
        public int IncomingVideoPacketReceived { get; set; }
        [JsonProperty("incomingVideoPacketsLost")] 
        public int IncomingVideoPacketsLost { get; set; }
    }
}
