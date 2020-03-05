using System;
using Newtonsoft.Json;

namespace VideoWeb.EventHub.Models
{
    public class Heartbeat
    {
        [JsonProperty("hearingId")]
        public Guid HearingId { get; set; }
        [JsonProperty("participantId")]
        public Guid ParticipantId { get; set; }
        [JsonProperty("outgoingAudioPercentageLost")]
        public decimal OutgoingAudioPercentageLost { get; set; }
        [JsonProperty("outgoingAudioPercentageLostRecent")]
        public string OutgoingAudioPercentageLostRecent { get; set; }
        [JsonProperty("incomingAudioPercentageLost")]
        public string IncomingAudioPercentageLost { get; set; }
        [JsonProperty("incomingAudioPercentageLostRecent")]
        public string IncomingAudioPercentageLostRecent { get; set; }
        [JsonProperty("outgoingVideoPercentageLost")]
        public string OutgoingVideoPercentageLost { get; set; }
        [JsonProperty("outgoingVideoPercentageLostRecent")]
        public string OutgoingVideoPercentageLostRecent { get; set; }
        [JsonProperty("incomingVideoPercentageLost")]
        public string IncomingVideoPercentageLost { get; set; }
        [JsonProperty("incomingVideoPercentageLostRecent")]
        public string IncomingVideoPercentageLostRecent { get; set; }
        [JsonProperty("browserName")]
        public string BrowserName { get; set; }
        [JsonProperty("browserVersion")]
        public string BrowserVersion { get; set; }
    }
}
