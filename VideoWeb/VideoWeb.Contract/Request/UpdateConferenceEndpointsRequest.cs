using System;
using System.Collections.Generic;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Contract.Request
{
    public class UpdateConferenceEndpointsRequest
    {
        public IList<EndpointResponse> ExistingEndpoints { get; set; } = new List<EndpointResponse>();
        public IList<EndpointResponse> NewEndpoints { get; set; } = new List<EndpointResponse>();
        public IList<Guid> RemovedEndpoints { get; set; } = new List<Guid>();
    }
}
