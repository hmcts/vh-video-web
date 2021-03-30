using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;

namespace VideoWeb.AuthenticationSchemes
{
    public abstract class ProviderSchemeBase
    {
        private readonly string _eventhubPath;

        protected ProviderSchemeBase(string eventhubPath)
        {
            _eventhubPath = eventhubPath;
        }

        public abstract AuthProvider Provider { get; }

        public string SchemeName => Provider.ToString();

        public string EventHubSchemeName => $"EventHub{Provider}";

        public AuthenticationBuilder AddScheme(AuthenticationBuilder builder)
        {
            return builder.AddJwtBearer(SchemeName, SetJwtBearerOptions);
        }

        public AuthenticationBuilder AddEventHubScheme(AuthenticationBuilder builder)
        {
            return builder.AddJwtBearer(EventHubSchemeName, options =>
            {
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["accessToken"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments(_eventhubPath))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
                SetJwtBearerOptions(options);
            });
        }

        protected abstract void SetJwtBearerOptions(JwtBearerOptions options);
    }
}
