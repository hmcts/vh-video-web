using System;

namespace VideoWeb.Common.Models
{
    public class VideoControlStatus : IComparable<VideoControlStatus>
    {
        public bool IsSpotlighted { get; set; }
        public bool IsLocalAudioMuted { get; set; }
        public bool IsLocalVideoMuted { get; set; }
        public int CompareTo(VideoControlStatus comparison)
        {
            bool areEqual = IsSpotlighted == comparison.IsSpotlighted && 
                            IsLocalAudioMuted == comparison.IsLocalAudioMuted && 
                            IsLocalVideoMuted == comparison.IsLocalVideoMuted;
            return areEqual ? 1 : 0;
        }
    }
}
