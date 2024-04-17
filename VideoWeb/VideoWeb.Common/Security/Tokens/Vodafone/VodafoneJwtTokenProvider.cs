using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;

namespace VideoWeb.Common.Security.Tokens.Vodafone;

public class VodafoneJwtTokenProvider : JwtTokenProvider, IVodafoneJwtTokenProvider
{
    public VodafoneJwtTokenProvider(VodafoneConfiguration vodafoneConfiguration) : base(vodafoneConfiguration)
    {
    }
}

