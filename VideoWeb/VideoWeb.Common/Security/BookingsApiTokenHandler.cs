using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using VideoWeb.Common.Configuration;

namespace VideoWeb.Common.Security
{
    public class BookingsApiTokenHandler : BaseServiceTokenHandler
    {
        public BookingsApiTokenHandler(IOptions<AzureAdConfiguration> azureAdConfiguration,
            IOptions<HearingServicesConfiguration> hearingServicesConfiguration, IMemoryCache memoryCache,
            ITokenProvider tokenProvider) : base(azureAdConfiguration, hearingServicesConfiguration, memoryCache,
            tokenProvider)
        {
        }
        
        protected override string TokenCacheKey => "BookingsApiServiceToken";
        protected override string ClientResource => HearingServicesConfiguration.BookingsApiResourceId;
    }
}