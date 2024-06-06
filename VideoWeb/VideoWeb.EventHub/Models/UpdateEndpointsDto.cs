using System;
using System.Collections.Generic;
using VideoWeb.Contract.Responses;

namespace VideoWeb.EventHub.Models
{
    public class UpdateEndpointsDto
    {
        public IList<VideoEndpointResponse> ExistingEndpoints { get; set; } = new List<VideoEndpointResponse>();
        public IList<VideoEndpointResponse> NewEndpoints { get; set; } = new List<VideoEndpointResponse>();
        public IList<Guid> RemovedEndpoints { get; set; } = new List<Guid>();
    }
}
