using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class EJudIdpSettingsResponseMapper : IMapTo<EJudAdConfiguration, IdpSettingsResponse>
    {
        public IdpSettingsResponse Map(EJudAdConfiguration input)
        {
            return new IdpSettingsResponse
            {
                ClientId = input.ClientId,
                TenantId = input.TenantId,
                RedirectUri = input.RedirectUri,
                PostLogoutRedirectUri = input.PostLogoutRedirectUri
            };
        }
    }
    
    public class VhIdpSettingsResponseMapper : IMapTo<AzureAdConfiguration, IdpSettingsResponse>
    {
        public IdpSettingsResponse Map(AzureAdConfiguration input)
        {
            return new IdpSettingsResponse
            {
                ClientId = input.ClientId,
                TenantId = input.TenantId,
                RedirectUri = input.RedirectUri,
                PostLogoutRedirectUri = input.PostLogoutRedirectUri
            };
        }
    }
}
