using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Models;
using VideoWeb.Common.Security.HashGen;

namespace VideoWeb.Extensions
{
    public static class ConfigureAuthSchemeExtensions
    {
        public static void RegisterAuthSchemes(this IServiceCollection serviceCollection, IConfiguration configuration)
        {
            var eventhubPath = configuration.GetValue<string>("VhServices:EventHubPath");
            var kinlyConfiguration = configuration.GetSection("KinlyConfiguration").Get<KinlyConfiguration>();
            var securitySettings = configuration.GetSection("AzureAd").Get<AzureAdConfiguration>();
            var securityKey = Convert.FromBase64String(kinlyConfiguration.CallbackSecret);
            serviceCollection.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                }).AddPolicyScheme(JwtBearerDefaults.AuthenticationScheme, "Handler", options =>
                    options.ForwardDefaultSelector = context =>
                        context.Request.Path.StartsWithSegments("/callback")
                            ? "Callback" : "Default")
                .AddJwtBearer("Default", options =>
                {
                    options.Authority = "https://login.microsoftonline.com/fb6e0e22-0da3-4c35-972a-9d61eb256508/v2.0"; //$"{ securitySettings.Authority}{securitySettings.TenantId}/";
                    options.TokenValidationParameters.ValidateLifetime = true;
                    options.TokenValidationParameters.ValidateAudience = false;
                    options.Audience = securitySettings.ClientId;
                    options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
                }).AddJwtBearer("EventHubUser", options =>
                {
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            // https://docs.microsoft.com/en-us/aspnet/core/signalr/configuration?view=aspnetcore-5.0&tabs=dotnet
                            // In the JavaScript client, the access token is used as a Bearer token,
                            // except in a few cases where browser APIs restrict the ability to apply headers (specifically, in Server-Sent Events and WebSockets requests).
                            // In these cases, the access token is provided as a query string value access_token
                            var accessToken = context.Request.Query["accessToken"];
                            if (string.IsNullOrEmpty(accessToken))
                            {
                                return Task.CompletedTask;
                            }

                            var path = context.HttpContext.Request.Path;
                            if (path.StartsWithSegments(eventhubPath))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };
                    options.Authority = "https://login.microsoftonline.com/fb6e0e22-0da3-4c35-972a-9d61eb256508/v2.0"; //$"{ securitySettings.Authority}{securitySettings.TenantId}/";
                    options.TokenValidationParameters.ValidateLifetime = true;
                    options.TokenValidationParameters.ValidateAudience = false;
                    options.Audience = securitySettings.ClientId;
                    options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
                }).AddJwtBearer("Callback", options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        IssuerSigningKey = new SymmetricSecurityKey(securityKey)
                    };
                });

            serviceCollection.AddMemoryCache();
            serviceCollection.AddAuthPolicies();
        }

        private static void AddAuthPolicies(this IServiceCollection serviceCollection)
        {
            serviceCollection.AddAuthorization(AddPolicies);
            serviceCollection.AddMvc(AddMvcPolicies);
        }

        private static void AddPolicies(AuthorizationOptions options)
        {
            var allRoles = new[]
            {
                AppRoles.CitizenRole, AppRoles.JudgeRole, AppRoles.RepresentativeRole, AppRoles.CaseAdminRole,
                AppRoles.VhOfficerRole, AppRoles.JudicialOfficeHolderRole
            };
            options.AddPolicy("Default", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(allRoles)
                .AddAuthenticationSchemes("Default")
                .Build());

            options.AddPolicy("EventHubUser", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                //.RequireRole(allRoles)
                .AddAuthenticationSchemes("EventHubUser")
                .Build());

            options.AddPolicy("Callback", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddAuthenticationSchemes("Callback")
                .Build());

            options.AddPolicy(AppRoles.JudgeRole, new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.JudgeRole)
                .AddAuthenticationSchemes("Default")
                .Build());

            options.AddPolicy(AppRoles.VhOfficerRole, new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.VhOfficerRole)
                .AddAuthenticationSchemes("Default")
                .Build());

            options.AddPolicy("Individual", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.CitizenRole, AppRoles.RepresentativeRole)
                .AddAuthenticationSchemes("Default")
                .Build());

            options.AddPolicy(AppRoles.RepresentativeRole, new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.RepresentativeRole)
                .AddAuthenticationSchemes("Default")
                .Build());

            options.AddPolicy(AppRoles.CitizenRole, new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.CitizenRole)
                .AddAuthenticationSchemes("Default")
                .Build());
        }

        private static void AddMvcPolicies(MvcOptions options)
        {
            options.Filters.Add(new AuthorizeFilter(new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser().Build()));
        }
    }
}
