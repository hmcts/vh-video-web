using VideoWeb.Common;
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
        SupplierConfiguration supplierConfiguration,
        string supplierName)
    {
        var ejudSettings = IdpSettingsResponseMapper.Map(eJudAdConfiguration);
        var vhAdSettings = IdpSettingsResponseMapper.Map(azureAdConfiguration);
        var dom1Settings = IdpSettingsResponseMapper.Map(dom1AdConfiguration);
        return new ClientSettingsResponse
        {
            AppInsightsConnectionString = azureAdConfiguration.ApplicationInsights.ConnectionString,
            EventHubPath = servicesConfiguration.EventHubPath,
            JoinByPhoneFromDate = supplierConfiguration.JoinByPhoneFromDate,
            SupplierTurnServer = supplierConfiguration.TurnServer,
            SupplierTurnServerUser = supplierConfiguration.TurnServerUser,
            SupplierTurnServerCredential = supplierConfiguration.TurnServerCredential,
            EJudIdpSettings = ejudSettings,
            Dom1IdpSettings = dom1Settings,
            VHIdpSettings = vhAdSettings,
            Supplier = supplierName,
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
