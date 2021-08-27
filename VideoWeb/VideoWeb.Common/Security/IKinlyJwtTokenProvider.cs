namespace VideoWeb.Common.Security
{
    public interface IKinlyJwtTokenProvider
    {
        string GenerateTokenForCallbackEndpoint(string claims, int expiresInMinutes);
        string GenerateToken(string claims, int expiresInMinutes);
    }
}
