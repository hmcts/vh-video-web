using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings;

public static class AllowedEndpointResponseMapper
{
    public static AllowedEndpointResponse Map(Endpoint input)
    {
        return new AllowedEndpointResponse
        {
            DisplayName = input.DisplayName,
            Id = input.Id,
            DefenceAdvocateUsername = input.DefenceAdvocateUsername,
        };
    }
}
