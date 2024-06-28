namespace VideoWeb.Common.Security.Tokens.Base;

public interface IJwtTokenProvider
{
    string GenerateTokenForCallbackEndpoint(string claims, int expiresInMinutes);
    string GenerateToken(string claims, int expiresInMinutes);
}
