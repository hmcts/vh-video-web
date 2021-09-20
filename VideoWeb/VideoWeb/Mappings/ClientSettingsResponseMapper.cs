using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ClientSettingsResponseMapper : IMapTo<AzureAdConfiguration, EJudAdConfiguration, HearingServicesConfiguration, KinlyConfiguration, ClientSettingsResponse>
    {
        private readonly IMapperFactory _mapperFactory;

        public ClientSettingsResponseMapper(IMapperFactory mapperFactory)
        {
            _mapperFactory = mapperFactory;
        }

        public ClientSettingsResponse Map(AzureAdConfiguration azureAdConfiguration, EJudAdConfiguration eJudAdConfiguration, HearingServicesConfiguration servicesConfiguration, KinlyConfiguration kinlyConfiguration)
        {
            var mapper = _mapperFactory.Get<IdpConfiguration, IdpSettingsResponse>();
            var ejudSettings = mapper.Map(eJudAdConfiguration);
            var vhAdSettings = mapper.Map(azureAdConfiguration);
            return new ClientSettingsResponse
            {
                AppInsightsInstrumentationKey = azureAdConfiguration.ApplicationInsights.InstrumentationKey,
                EventHubPath = servicesConfiguration.EventHubPath,
                JoinByPhoneFromDate = kinlyConfiguration.JoinByPhoneFromDate,
                KinlyTurnServer = kinlyConfiguration.TurnServer,
                KinlyTurnServerUser = kinlyConfiguration.TurnServerUser,
                KinlyTurnServerCredential = kinlyConfiguration.TurnServerCredential,
                EJudIdpSettings = ejudSettings,
                VHIdpSettings = vhAdSettings,
                EnableVideoFilters = servicesConfiguration.EnableVideoFilters,
                BlurRadius = servicesConfiguration.BlurRadius
            };
        }

    }
}
