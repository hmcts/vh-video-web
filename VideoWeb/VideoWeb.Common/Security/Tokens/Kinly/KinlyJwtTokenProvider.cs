using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;

namespace VideoWeb.Common.Security.Tokens.Kinly;

public class KinlyJwtTokenProvider : JwtTokenProvider, IKinlyJwtTokenProvider
{
    public KinlyJwtTokenProvider(KinlyConfiguration supplierConfiguration) : base(supplierConfiguration)
    {
    }
}

