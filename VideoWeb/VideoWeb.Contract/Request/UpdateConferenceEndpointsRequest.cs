using System;
using System.Collections.Generic;
using VideoApi.Contract.Responses;

namespace VideoWeb.Contract.Request
{
    public class UpdateConferenceEndpointsRequest
    {
        public List<EndpointResponse> ExistingEndpoints { get; set; } = new();
        public List<EndpointResponse> NewEndpoints { get; set; } = new();
        public List<Guid> RemovedEndpoints { get; set; } = new();
    }
}
