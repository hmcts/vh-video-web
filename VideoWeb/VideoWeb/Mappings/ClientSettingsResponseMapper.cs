using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ClientSettingsResponseMapper : IMapTo<AzureAdConfiguration, HearingServicesConfiguration, KinlyConfiguration, ClientSettingsResponse>
    {
        public ClientSettingsResponse Map(AzureAdConfiguration input1, HearingServicesConfiguration servicesConfiguration, KinlyConfiguration kinlyConfiguration)
        {
            return new ClientSettingsResponse
            {
                ClientId = input1.ClientId,
                TenantId = input1.TenantId,
                RedirectUri = input1.RedirectUri,
                PostLogoutRedirectUri = input1.PostLogoutRedirectUri,
                AppInsightsInstrumentationKey = input1.ApplicationInsights.InstrumentationKey,
                EventHubPath = servicesConfiguration.EventHubPath,
                JoinByPhoneFromDate = kinlyConfiguration.JoinByPhoneFromDate,
                KinlyTurnServer = kinlyConfiguration.TurnServer,
                KinlyTurnServerUser = kinlyConfiguration.TurnServerUser,
                KinlyTurnServerCredential = kinlyConfiguration.TurnServerCredential
            };
        }

    }
}
