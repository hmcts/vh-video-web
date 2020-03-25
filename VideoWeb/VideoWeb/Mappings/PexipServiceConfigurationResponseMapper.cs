using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;

namespace VideoWeb.Mappings
{
    public static class PexipServiceConfigurationResponseMapper
    {
        public static SelfTestPexipResponse MapConfigToResponseModel(PexipConfigResponse pexipConfigResponse)
        {
            return new SelfTestPexipResponse
            {
                PexipSelfTestNode = pexipConfigResponse?.Pexip_self_test_node
            };
        }
    }
}
