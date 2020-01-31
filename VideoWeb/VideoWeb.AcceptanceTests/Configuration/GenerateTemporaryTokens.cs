using Microsoft.Extensions.Options;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public static class GenerateTemporaryTokens
    {
        private const int TokenExpiresInMinutes = 10;
        public static string SetDefaultVideoWebBearerToken(AzureAdConfiguration azureAdConfiguration)
        {
            return new TokenProvider(Options.Create(azureAdConfiguration)).GetClientAccessToken(
                azureAdConfiguration.ClientId, azureAdConfiguration.ClientSecret, azureAdConfiguration.ClientId);
        }

        public static string SetCustomJwTokenForCallback(CustomTokenSettings customTokenSettings)
        {
            var generateTokenWithAsciiKey = new CustomJwtTokenProvider(customTokenSettings).GenerateTokenForCallbackEndpoint("VhVideoApi", TokenExpiresInMinutes);
            return generateTokenWithAsciiKey;
        }
    }
}
