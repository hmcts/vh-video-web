using System;
using System.Collections.Generic;
using BookingsApi.Contract.V1.Enums;

namespace VideoWeb.Common.Models
{
    public class Endpoint
    {
        public Guid Id { get; set; }
        public string DisplayName { get; set; }
        public EndpointStatus EndpointStatus { get; set; }
        public List<EndpointParticipant> EndpointParticipants { get; set; }
    }

    public class EndpointParticipant
    {
        public Guid ParticipantId { get; set; }
        public Guid ParticipantRefId { get; set; }
        public string ParticipantUsername { get; set; }
        public LinkType LinkedParticipantType { get; set; }
    }
}
