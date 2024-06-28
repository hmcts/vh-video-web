using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Client;
using VideoWeb.Common.Configuration;

namespace VideoWeb.Common.Security.Tokens
{
    public interface ITokenProvider
    {
        Task<string> GetClientAccessToken(string clientId, string clientSecret, string clientResource);
        Task<AuthenticationResult> GetAuthorisationResult(string clientId, string clientSecret, string clientResource);
    }

    public class TokenProvider : ITokenProvider
    {
        private readonly AzureAdConfiguration _azureAdConfiguration;

        public TokenProvider(IOptions<AzureAdConfiguration> azureAdConfiguration)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
        }

        public async Task<string> GetClientAccessToken(string clientId, string clientSecret, string clientResource)
        {
            var result = await GetAuthorisationResult(clientId, clientSecret, clientResource);
            return result.AccessToken;
        }

        public async Task<AuthenticationResult> GetAuthorisationResult(string clientId, string clientSecret, string clientResource)
        {
            AuthenticationResult result;
            var authority = $"{_azureAdConfiguration.Authority}{_azureAdConfiguration.TenantId}";
            var app =ConfidentialClientApplicationBuilder.Create(clientId).WithClientSecret(clientSecret)
                .WithAuthority(authority).Build();
            
            try
            {
                result = await app.AcquireTokenForClient(new[] {$"{clientResource}/.default"}).ExecuteAsync();
            }
            catch (MsalServiceException)
            {
                throw new UnauthorizedAccessException();
            }

            return result;
        }
    }
}
