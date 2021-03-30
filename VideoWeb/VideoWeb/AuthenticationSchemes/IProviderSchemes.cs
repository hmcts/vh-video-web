using Microsoft.AspNetCore.Authentication;
using System.IdentityModel.Tokens.Jwt;

namespace VideoWeb.AuthenticationSchemes
{
    public interface IProviderSchemes
    {
        public AuthProvider Provider { get; }

        public string SchemeName { get; }

        public string EventHubSchemeName { get; }

        public string GetScheme(bool eventHub) => eventHub ? EventHubSchemeName : SchemeName;

        public bool BelongsToScheme(JwtSecurityToken jwtSecurityToken);

        public string[] GetProviderSchemes() => new[] { SchemeName, EventHubSchemeName };

        public AuthenticationBuilder AddSchemes(AuthenticationBuilder builder)
        {
            builder = AddScheme(builder);
            builder = AddEventHubScheme(builder);
            return builder;
        }

        public AuthenticationBuilder AddScheme(AuthenticationBuilder builder);

        public AuthenticationBuilder AddEventHubScheme(AuthenticationBuilder builder);
    }
}
