using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Request
{
    public class SetConferenceVideoControlStatusesRequest
    {
        public class VideoControlStatusRequest
        {
            public bool IsSpotlighted { get; set; }
            public bool IsLocalAudioMuted { get; set; }
            public bool IsLocalVideoMuted { get; set; }
        }
    
        public Dictionary<string, VideoControlStatusRequest> ParticipantIdToVideoControlStatusMap { get; set; }
    }
}
