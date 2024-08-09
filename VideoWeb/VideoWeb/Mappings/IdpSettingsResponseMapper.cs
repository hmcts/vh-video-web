using VideoWeb.Common.Configuration;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings;

public static class IdpSettingsResponseMapper
{
    public static IdpSettingsResponse Map(IdpConfiguration input)
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
