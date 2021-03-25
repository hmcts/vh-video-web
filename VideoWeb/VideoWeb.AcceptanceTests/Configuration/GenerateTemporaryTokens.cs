using Microsoft.Extensions.Options;
using System.Threading.Tasks;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public static class GenerateTemporaryTokens
    {
        private const int TokenExpiresInMinutes = 10;

        public static Task<string> SetDefaultVideoWebBearerToken(AzureAdConfiguration azureAdConfiguration)
        {
            return new TokenProvider(Options.Create(azureAdConfiguration)).GetClientAccessToken(
                azureAdConfiguration.ClientId, azureAdConfiguration.ClientSecret, azureAdConfiguration.ClientId);
        }

        public static string SetCustomJwTokenForCallback(KinlyConfiguration kinlyConfiguration)
        {
            var generateTokenWithAsciiKey = new CustomJwtTokenProvider(kinlyConfiguration).GenerateTokenForCallbackEndpoint("VhVideoApi", TokenExpiresInMinutes);
            return generateTokenWithAsciiKey;
        }
    }
}
