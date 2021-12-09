using System;
using System.Collections.Generic;

namespace VideoWeb.Common.Models
{
    public class ConferenceVideoControlStatuses
    {
        public Dictionary<Guid, VideoControlStatus> ParticipantIdToVideoControlStatusMap { get; set; }
    }
}
