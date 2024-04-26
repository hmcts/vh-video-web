using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens;
using VideoWeb.Common.Security.Tokens.Kinly;

namespace VideoWeb.UnitTests.Builders
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
            var generateTokenWithAsciiKey = new KinlyJwtTokenProvider(kinlyConfiguration).GenerateTokenForCallbackEndpoint("VhVideoApi", TokenExpiresInMinutes);
            return generateTokenWithAsciiKey;
        }
    }
}
