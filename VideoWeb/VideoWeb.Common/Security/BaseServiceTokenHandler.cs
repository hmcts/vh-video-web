using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using VideoWeb.Common.Configuration;

namespace VideoWeb.Common.Security
{
    public abstract class BaseServiceTokenHandler : DelegatingHandler
    {
        private readonly ITokenProvider _tokenProvider;
        private readonly IMemoryCache _memoryCache;
        private readonly AzureAdConfiguration _azureAdConfiguration;
        protected readonly HearingServicesConfiguration HearingServicesConfiguration;
        
        protected abstract string TokenCacheKey { get; }
        protected abstract string ClientResource { get; }

        protected BaseServiceTokenHandler(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<HearingServicesConfiguration> hearingServicesConfiguration, IMemoryCache memoryCache,
            ITokenProvider tokenProvider)
        {
            _azureAdConfiguration = azureAdConfiguration.Value;
            HearingServicesConfiguration = hearingServicesConfiguration.Value;
            _memoryCache = memoryCache;
            _tokenProvider = tokenProvider;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var token = GetServiceToServiceToken();
            request.Headers.Add("Authorization", $"Bearer {token}");
            return await base.SendAsync(request, cancellationToken);
        }
        
        protected string GetServiceToServiceToken()
        {
            var token = _memoryCache.Get<string>(TokenCacheKey);
            if (!string.IsNullOrEmpty(token)) return token;
            
            var authenticationResult = _tokenProvider.GetAuthorisationResult(_azureAdConfiguration.ClientId,
                _azureAdConfiguration.ClientSecret, ClientResource);
            token = authenticationResult.AccessToken;
            var tokenExpireDateTime = authenticationResult.ExpiresOn.DateTime.AddMinutes(-1);
            _memoryCache.Set(TokenCacheKey, token, tokenExpireDateTime);

            return token;
        }
    }
}