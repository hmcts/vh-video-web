using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VideoWeb.Contract.Responses;

namespace VideoWeb.EventHub.Models
{
    public class UpdateEndpointsDto
    {
        [JsonProperty("ExistingEndpoints")]
        public IList<VideoEndpointResponse> ExistingEndpoints { get; set; } = new List<VideoEndpointResponse>();
        [JsonProperty("NewEndpoints")]
        public IList<VideoEndpointResponse> NewEndpoints { get; set; } = new List<VideoEndpointResponse>();
        [JsonProperty("RemovedEndpoints")]
        public IList<Guid> RemovedEndpoints { get; set; } = new List<Guid>();
    }
}
