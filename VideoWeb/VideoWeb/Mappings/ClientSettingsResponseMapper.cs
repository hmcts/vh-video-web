using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings;

public static class ClientSettingsResponseMapper{
    
    public static ClientSettingsResponse Map(
        AzureAdConfiguration azureAdConfiguration,
        EJudAdConfiguration eJudAdConfiguration, 
        Dom1AdConfiguration dom1AdConfiguration,
        HearingServicesConfiguration servicesConfiguration, 
        List<SupplierConfiguration> supplierConfigurations,
        DynatraceConfiguration dynatraceConfiguration)
    {
        var ejudSettings = IdpSettingsResponseMapper.Map(eJudAdConfiguration);
        var vhAdSettings = IdpSettingsResponseMapper.Map(azureAdConfiguration);
        var dom1Settings = IdpSettingsResponseMapper.Map(dom1AdConfiguration);
        return new ClientSettingsResponse
        {
            AppInsightsConnectionString = azureAdConfiguration.ApplicationInsights.ConnectionString,
            EventHubPath = servicesConfiguration.EventHubPath,
            SupplierConfigurations = supplierConfigurations
                .Select(c => c.Map())
                .ToList(),
            EJudIdpSettings = ejudSettings,
            Dom1IdpSettings = dom1Settings,
            VHIdpSettings = vhAdSettings,
            EnableVideoFilters = servicesConfiguration.EnableVideoFilters,
            EnableAndroidSupport = servicesConfiguration.EnableAndroidSupport,
            EnableIOSMobileSupport = servicesConfiguration.EnableIOSMobileSupport,
            EnableIOSTabletSupport = servicesConfiguration.EnableIOSTabletSupport,
            BlurRadius = servicesConfiguration.BlurRadius,
            LaunchDarklyClientId = servicesConfiguration.LaunchDarklyClientId,
            DynatraceRumLink = dynatraceConfiguration.DynatraceRumLink
        };
    }
    
}
