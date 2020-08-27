using System;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings
{
    public static class EndpointsResponseMapper
    {
        public static VideoEndpointResponse Map(Services.Video.EndpointResponse response)
        {
            return new VideoEndpointResponse
            {
                DisplayName = response.Display_name,
                Id = response.Id,
                Pin = response.Pin,
                SipAddress = response.Sip_address,
                Status = Enum.Parse<EndpointStatus>(response.Status.ToString())
            };
        }
    }
}
