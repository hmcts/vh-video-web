using System.Text.Json.Serialization;

namespace VideoWeb.EventHub.Models
{
    public class Heartbeat
    {
        [JsonPropertyName("hearing_id")]
        public string HearingId { get; set; }
        [JsonPropertyName("ConferenceId")]
        public string ConferenceId { get; set; }
        [JsonPropertyName("participant_id")]
        public string ParticipantId { get; set; }
        [JsonPropertyName("media_statistics")] 
        public MediaStatistics MediaStatistics { get; set; }
    }

    public class MediaStatistics
    {
        [JsonPropertyName("outgoing")] 
        public MediaStatisticsType Outgoing { get; set; }
        [JsonPropertyName("incoming")] 
        public MediaStatisticsType Incoming { get; set; }  
    }

    public class MediaStatisticsType
    {
        [JsonPropertyName("audio")] 
        public PacketData Audio { get; set; }
        [JsonPropertyName("video")] 
        public PacketData Video { get; set; }
    }

    public class PacketData
    {
        [JsonPropertyName("configured_bitrate")]
        public string ConfiguredBitrate { get; set; }
        [JsonPropertyName("packets_sent")]
        public string PacketsSent { get; set; }
        [JsonPropertyName("packets_lost")]
        public string PacketsLost { get; set; }
        [JsonPropertyName("percentage_lost")]
        public string PercentageLost { get; set; }
        [JsonPropertyName("percentage_lost_recent")]
        public string PercentageLostRecent { get; set; }
        [JsonPropertyName("bitrate")]
        public string Bitrate { get; set; }
        [JsonPropertyName("resolution")]
        public string Resolution { get; set; }
        [JsonPropertyName("codec")]
        public string Codec { get; set; }
    }
}
