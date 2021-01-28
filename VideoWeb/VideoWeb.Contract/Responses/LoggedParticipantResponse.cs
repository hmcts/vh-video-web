using System;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Responses
{
    public class LoggedParticipantResponse
    {
        public Guid ParticipantId { get; set; }
        public string AdminUsername { get; set; }
        public Role Role { get; set; }
        public string DisplayName { get; set; }
    }
}
