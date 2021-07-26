using VideoWeb.Common.Models;

namespace VideoWeb.Common.Security
{
    public interface IMagicLinksJwtTokenProvider
    {
        string GenerateToken(string name, string userName, string role, int expiresInMinutes);
    }
}
