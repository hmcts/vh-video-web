using System;

namespace VideoWeb.Common.Models
{
    public class VideoControlStatus : IComparable<VideoControlStatus>
    {
        public bool IsRemoteMuted { get; set; }
        public bool IsSpotlighted { get; set; }
        public bool IsLocalAudioMuted { get; set; }
        public bool IsLocalVideoMuted { get; set; }
        public int CompareTo(VideoControlStatus comparison)
        {
            bool areEqual = IsSpotlighted == comparison.IsSpotlighted && 
                            IsRemoteMuted == comparison.IsRemoteMuted && 
                            IsLocalAudioMuted == comparison.IsLocalAudioMuted && 
                            IsLocalVideoMuted == comparison.IsLocalVideoMuted;
            return areEqual ? 1 : 0;
        }
    }
}
