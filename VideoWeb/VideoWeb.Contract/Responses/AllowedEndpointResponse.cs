using System;
using System.Collections.Generic;

namespace VideoWeb.Contract.Responses
{
    public class AllowedEndpointResponse
    {
        public Guid Id { get; set; }
        public string DisplayName { get; set; }
        public List<EndpointParticipant> EndpointParticipants { get; set; }
    }
}
