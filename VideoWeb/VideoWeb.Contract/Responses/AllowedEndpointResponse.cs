using System;

namespace VideoWeb.Contract.Responses
{
    public class AllowedEndpointResponse
    {
        public Guid Id { get; set; }
        public string DisplayName { get; set; }
        public string DefenceAdvocateUsername { get; set; }
    }
}
