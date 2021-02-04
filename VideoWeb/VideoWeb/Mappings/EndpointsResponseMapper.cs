using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class EndpointsResponseMapper : IMapTo<EndpointResponse, int, VideoEndpointResponse>
    {
        public VideoEndpointResponse Map(EndpointResponse endpoint, int index)
        {
            var pexipDisplayName = $"T{100 + index};{endpoint.DisplayName};{endpoint.Id}";
            return new VideoEndpointResponse
            {
                DisplayName = endpoint.DisplayName,
                Id = endpoint.Id,
                Status = Enum.Parse<EndpointStatus>(endpoint.Status.ToString()),
                DefenceAdvocateUsername = endpoint.DefenceAdvocate,
                PexipDisplayName = pexipDisplayName
            };
        }
    }
}
