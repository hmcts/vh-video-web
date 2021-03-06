using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class PexipServiceConfigurationResponseMapper : IMapTo<PexipConfigResponse, SelfTestPexipResponse>
    {
        public SelfTestPexipResponse Map(PexipConfigResponse pexipConfigResponse)
        {
            return new SelfTestPexipResponse
            {
                PexipSelfTestNode = pexipConfigResponse?.Pexip_self_test_node
            };
        }
    }
}
