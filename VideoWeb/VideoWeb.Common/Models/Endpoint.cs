using System;
using System.Collections.Generic;

namespace VideoWeb.Common.Models
{
    public class Endpoint
    {
        public Guid Id { get; set; }
        public string DisplayName { get; set; }
        public EndpointStatus EndpointStatus { get; set; }
        public List<string> ParticipantsLinked { get; set; }
        public ConsultationRoom CurrentRoom { get; set; }
        public InterpreterLanguage InterpreterLanguage { get; set; }
        public string ExternalReferenceId { get; set; }
        public List<string> ProtectFrom { get; set; } = [];
        /// <summary>
        /// This is the time stamp of the last event that was sent for a change to the endpoint
        /// </summary>
        public DateTime? LastEventTime { get; set; }
    }
}
