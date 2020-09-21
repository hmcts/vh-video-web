using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class EndpointsResponseMapper
    {
        public static VideoEndpointResponse Map(EndpointResponse endpoint, int index)
        {
            var pexipDisplayName = $"T{100 + index};{endpoint.Display_name};{endpoint.Id}";
            return new VideoEndpointResponse
            {
                DisplayName = endpoint.Display_name,
                Id = endpoint.Id,
                Status = Enum.Parse<EndpointStatus>(endpoint.Status.ToString()),
                DefenceAdvocateUsername = endpoint.Defence_advocate,
                PexipDisplayName = pexipDisplayName
            };
        }
    }
}
