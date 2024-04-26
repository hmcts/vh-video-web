using VideoWeb.Common;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ClientSettingsResponseMapper : IMapTo<AzureAdConfiguration, EJudAdConfiguration, Dom1AdConfiguration,
        HearingServicesConfiguration, SupplierConfiguration, ClientSettingsResponse>
    {
        private readonly IMapperFactory _mapperFactory;
        private readonly IFeatureToggles _featureToggles;

        public ClientSettingsResponseMapper(IMapperFactory mapperFactory, IFeatureToggles featureToggles)
        {
            _mapperFactory = mapperFactory;
            _featureToggles = featureToggles;
        }

        public ClientSettingsResponse Map(AzureAdConfiguration azureAdConfiguration,
            EJudAdConfiguration eJudAdConfiguration, Dom1AdConfiguration dom1AdConfiguration,
            HearingServicesConfiguration servicesConfiguration, SupplierConfiguration supplierConfiguration)
        {
            var mapper = _mapperFactory.Get<IdpConfiguration, IdpSettingsResponse>();
            var ejudSettings = mapper.Map(eJudAdConfiguration);
            var vhAdSettings = mapper.Map(azureAdConfiguration);
            var dom1Settings = mapper.Map(dom1AdConfiguration);
            return new ClientSettingsResponse
            {
                AppInsightsConnectionString = azureAdConfiguration.ApplicationInsights.ConnectionString,
                EventHubPath = servicesConfiguration.EventHubPath,
                JoinByPhoneFromDate = supplierConfiguration.JoinByPhoneFromDate,
                SupplierTurnServer = supplierConfiguration.TurnServer,
                SupplierTurnServerUser = supplierConfiguration.TurnServerUser,
                SupplierTurnServerCredential = supplierConfiguration.TurnServerCredential,
                Supplier = _featureToggles.Vodafone() ? "vodafone" : "kinly",
                EJudIdpSettings = ejudSettings,
                Dom1IdpSettings = dom1Settings,
                VHIdpSettings = vhAdSettings,
                EnableVideoFilters = servicesConfiguration.EnableVideoFilters,
                EnableAndroidSupport = servicesConfiguration.EnableAndroidSupport,
                EnableIOSMobileSupport = servicesConfiguration.EnableIOSMobileSupport,
                EnableIOSTabletSupport = servicesConfiguration.EnableIOSTabletSupport,
                EnableDynamicEvidenceSharing = servicesConfiguration.EnableDynamicEvidenceSharing,
                BlurRadius = servicesConfiguration.BlurRadius,
                LaunchDarklyClientId = servicesConfiguration.LaunchDarklyClientId
            };
        }

    }
}
