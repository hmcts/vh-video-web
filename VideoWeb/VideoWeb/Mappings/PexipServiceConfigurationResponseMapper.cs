using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings;

public static class PexipServiceConfigurationResponseMapper
{
    public static SelfTestPexipResponse Map(PexipConfigResponse pexipConfigResponse)
    {
        return new SelfTestPexipResponse
        {
            PexipSelfTestNode = pexipConfigResponse?.PexipSelfTestNode
        };
    }
}
