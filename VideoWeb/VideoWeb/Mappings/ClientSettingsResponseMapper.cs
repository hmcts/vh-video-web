using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ClientSettingsResponseMapper : IMapTo<AzureAdConfiguration, EJudAdConfiguration, Dom1AdConfiguration,
        HearingServicesConfiguration, List<SupplierConfiguration>, ClientSettingsResponse>
    {
        private readonly IMapperFactory _mapperFactory;

        public ClientSettingsResponseMapper(IMapperFactory mapperFactory)
        {
            _mapperFactory = mapperFactory;
        }

        public ClientSettingsResponse Map(AzureAdConfiguration azureAdConfiguration,
            EJudAdConfiguration eJudAdConfiguration, Dom1AdConfiguration dom1AdConfiguration,
            HearingServicesConfiguration servicesConfiguration, List<SupplierConfiguration> supplierConfigurations)
        {
            var mapper = _mapperFactory.Get<IdpConfiguration, IdpSettingsResponse>();
            var ejudSettings = mapper.Map(eJudAdConfiguration);
            var vhAdSettings = mapper.Map(azureAdConfiguration);
            var dom1Settings = mapper.Map(dom1AdConfiguration);
            return new ClientSettingsResponse
            {
                AppInsightsConnectionString = azureAdConfiguration.ApplicationInsights.ConnectionString,
                EventHubPath = servicesConfiguration.EventHubPath,
                SupplierSettings = supplierConfigurations
                    .Select(c => c.Map())
                    .ToList(),
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
