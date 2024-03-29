using VideoWeb.Common.Configuration;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class IdpSettingsResponseMapper : IMapTo<IdpConfiguration, IdpSettingsResponse>
    {
        public IdpSettingsResponse Map(IdpConfiguration input)
        {
            return new IdpSettingsResponse
            {
                ConfigId = input.ConfigId,
                ClientId = input.ClientId,
                TenantId = input.TenantId,
                RedirectUri = input.RedirectUri,
                PostLogoutRedirectUri = input.PostLogoutRedirectUri,
                ResourceId = input.ResourceId
            };
        }
    }
}
