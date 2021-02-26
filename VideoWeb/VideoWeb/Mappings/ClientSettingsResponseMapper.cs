using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ClientSettingsResponseMapper : IMapTo<AzureAdConfiguration, HearingServicesConfiguration, KinlyConfiguration, ClientSettingsResponse>
    {
        public ClientSettingsResponse Map(AzureAdConfiguration azureAdConfiguration, HearingServicesConfiguration servicesConfiguration, KinlyConfiguration kinlyConfiguration)
        {
            return new ClientSettingsResponse
            {
                ClientId = azureAdConfiguration.ClientId,
                TenantId = azureAdConfiguration.TenantId,
                RedirectUri = azureAdConfiguration.RedirectUri,
                PostLogoutRedirectUri = azureAdConfiguration.PostLogoutRedirectUri,
                VideoApiUrl = servicesConfiguration.VideoApiUrl,
                AppInsightsInstrumentationKey = azureAdConfiguration.ApplicationInsights.InstrumentationKey,
                EventHubPath = servicesConfiguration.EventHubPath,
                JoinByPhoneFromDate = kinlyConfiguration.JoinByPhoneFromDate
            };
        }

    }
}
