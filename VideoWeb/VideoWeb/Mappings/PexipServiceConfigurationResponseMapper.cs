using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class PexipServiceConfigurationResponseMapper : IMapTo<SelfTestPexipResponse, PexipConfigResponse>
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
