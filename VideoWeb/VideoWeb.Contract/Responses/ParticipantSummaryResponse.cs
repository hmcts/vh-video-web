using System;
using VideoWeb.Services.Video;

namespace VideoWeb.Contract.Responses
{
    public class ParticipantSummaryResponse
    {
        public Guid ParticipantId { get; set; }
        public string Username { get; set; }
        public ParticipantStatus Status { get; set; }
        public string Role { get; set; }
    }
}
