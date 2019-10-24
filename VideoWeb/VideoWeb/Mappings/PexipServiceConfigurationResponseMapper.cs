using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public class PexipServiceConfigurationResponseMapper
    {
        public SelfTestPexipResponse MapConfigToResponseModel(PexipConfigResponse pexipConfigResponse)
        {
            return new SelfTestPexipResponse
            {
                PexipSelfTestNode = pexipConfigResponse != null ? pexipConfigResponse.Pexip_self_test_node : null
            };
        }
    }
}
