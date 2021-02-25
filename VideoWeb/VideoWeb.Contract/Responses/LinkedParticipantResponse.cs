using System;
using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Responses
{
    public class LinkedParticipantResponse
    {
        public Guid ParticipantId { get; set; }

        public Guid LinkedParticipantId { get; set; }

        public LinkedParticipantType Type { get; set; }
    }
}
