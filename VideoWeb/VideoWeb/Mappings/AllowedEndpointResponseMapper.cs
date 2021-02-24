using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class AllowedEndpointResponseMapper : IMapTo<Endpoint, AllowedEndpointResponse>
    {
        public AllowedEndpointResponse Map(Endpoint input)
        {
            return new AllowedEndpointResponse
            {
                DefenceAdvocateUsername = input.DefenceAdvocateUsername,
                DisplayName = input.DisplayName,
                Id = input.Id
            };
        }
    }
}
