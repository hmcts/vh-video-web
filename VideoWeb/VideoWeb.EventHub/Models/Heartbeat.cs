﻿using Newtonsoft.Json;

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
    }
}
