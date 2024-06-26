using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Cache.Mappers;

public static class EndpointCacheMapper
{
    public static Endpoint MapEndpointToCacheModel(EndpointResponse endpointResponse)
    {
        return new Endpoint
        {
            Id = endpointResponse.Id,
            DisplayName = endpointResponse.DisplayName,
            EndpointStatus = (EndpointStatus) Enum.Parse(typeof(EndpointStatus), endpointResponse.Status.ToString()),
            DefenceAdvocate = endpointResponse.DefenceAdvocate
        };
    }
}
