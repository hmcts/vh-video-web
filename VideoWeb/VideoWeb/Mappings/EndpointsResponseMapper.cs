using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class EndpointsResponseMapper : IMapTo<EndpointResponse, Endpoint>
    {

        public EndpointsResponseMapper()
        {
        }

        public Endpoint Map(EndpointResponse endpoint)
        {
            return new Endpoint
            {
                DisplayName = endpoint.DisplayName,
                Id = endpoint.Id,
                EndpointStatus =  (EndpointStatus)((int)endpoint.Status),
                DefenceAdvocateUsername = endpoint.DefenceAdvocate,
            };
        }
    }
}
