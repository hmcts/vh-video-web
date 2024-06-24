using System;

namespace VideoWeb.Common.Models
{
    public class Endpoint
    {
        public Guid Id { get; set; }
        public string DisplayName { get; set; }
        public EndpointStatus EndpointStatus { get; set; }
        public string DefenceAdvocateUsername { get; set; }
        public ConsultationRoom CurrentRoom { get; set; }
    }
}
