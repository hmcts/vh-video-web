using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ClientSettingsResponseMapper : IMapTo<AzureAdConfiguration,  EJudAdConfiguration,HearingServicesConfiguration, KinlyConfiguration, ClientSettingsResponse>
    {
        private readonly IMapperFactory _mapperFactory;

        public ClientSettingsResponseMapper(IMapperFactory mapperFactory)
        {
            _mapperFactory = mapperFactory;
        }

        public ClientSettingsResponse Map(AzureAdConfiguration azureAdConfiguration, EJudAdConfiguration eJudAdConfiguration, HearingServicesConfiguration servicesConfiguration, KinlyConfiguration kinlyConfiguration)
        {
            var ejudSettings = _mapperFactory
                .Get<EJudAdConfiguration, IdpSettingsResponse>().Map(eJudAdConfiguration);
            var vhAdSettings = _mapperFactory
                .Get<AzureAdConfiguration, IdpSettingsResponse>().Map(azureAdConfiguration);
            return new ClientSettingsResponse
            {
                ClientId = azureAdConfiguration.ClientId,
                TenantId = azureAdConfiguration.TenantId,
                RedirectUri = azureAdConfiguration.RedirectUri,
                PostLogoutRedirectUri = azureAdConfiguration.PostLogoutRedirectUri,
                AppInsightsInstrumentationKey = azureAdConfiguration.ApplicationInsights.InstrumentationKey,
                EventHubPath = servicesConfiguration.EventHubPath,
                JoinByPhoneFromDate = kinlyConfiguration.JoinByPhoneFromDate,
                KinlyTurnServer = kinlyConfiguration.TurnServer,
                KinlyTurnServerUser = kinlyConfiguration.TurnServerUser,
                KinlyTurnServerCredential = kinlyConfiguration.TurnServerCredential,
                EJudIdpSettings = ejudSettings,
                VHIdpSettings = vhAdSettings
            };
        }

    }
}
