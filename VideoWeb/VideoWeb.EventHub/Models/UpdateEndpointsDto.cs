using System;
using System.Collections.Generic;
using VideoWeb.Contract.Responses;

namespace VideoWeb.EventHub.Models
{
    public class UpdateEndpointsDto
    {
        public List<VideoEndpointResponse> ExistingEndpoints { get; set; } = new();
        public List<VideoEndpointResponse> NewEndpoints { get; set; } = new();
        public List<Guid> RemovedEndpoints { get; set; } = new();
    }
}
