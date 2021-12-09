using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Request
{
    public class SetConferenceVideoControlStatusesRequest
    {
        public Dictionary<Guid, VideoControlStatus> ParticipantIdToVideoControlStatusMap { get; set; }
    }
}
