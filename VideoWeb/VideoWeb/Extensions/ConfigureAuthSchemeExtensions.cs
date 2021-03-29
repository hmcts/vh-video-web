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
                {
                    options.ForwardDefaultSelector = context =>
                    {
                        if (context.Request.Path.StartsWithSegments("/callback"))
                        {
                            return "Callback";
                        }
                        var foundHeader = context.Request.Headers.TryGetValue("oidc-provider", out var authType);
                        return foundHeader ? authType.ToString() : "vhaad";
                    };
                })
                .AddJwtBearer("vhaad", options =>
                {
                    options.Authority = $"{securitySettings.Authority}{securitySettings.TenantId}/v2.0";
                    options.TokenValidationParameters.ValidateLifetime = true;
                    options.TokenValidationParameters.NameClaimType = "preferred_username";
                    options.Audience = securitySettings.ClientId;
                    options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
                })
                .AddJwtBearer("ejud", options =>
                {
                    options.Authority = "https://login.microsoftonline.com/0b90379d-18de-426a-ae94-7f62441231e0/v2.0";
                    options.TokenValidationParameters.ValidateLifetime = true;
                    options.TokenValidationParameters.NameClaimType = "preferred_username";
                    options.Audience = "a6596b93-7bd6-4363-81a4-3e6d9aa2df2b";
                    options.TokenValidationParameters.ClockSkew = TimeSpan.Zero;
                    // TODO: On token validation get roles from userapi
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
                    options.Authority = $"{securitySettings.Authority}{securitySettings.TenantId}/v2.0";
                    options.TokenValidationParameters.ValidateLifetime = true;
                    options.TokenValidationParameters.NameClaimType = "preferred_username";
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
            options.AddPolicy("vhaad", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(allRoles)
                .AddAuthenticationSchemes("vhaad")
                .Build());

            options.AddPolicy("ejud", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(allRoles)
                .AddAuthenticationSchemes("ejud")
                .Build());

            options.AddPolicy("EventHubUser", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(allRoles)
                .AddAuthenticationSchemes("EventHubUser")
                .Build());

            options.AddPolicy("Callback", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddAuthenticationSchemes("Callback")
                .Build());

            options.AddPolicy(AppRoles.JudgeRole, new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.JudgeRole)
                .AddAuthenticationSchemes("vhaad")
                .AddAuthenticationSchemes("ejud")
                .Build());

            options.AddPolicy(AppRoles.VhOfficerRole, new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.VhOfficerRole)
                .AddAuthenticationSchemes("vhaad")
                .AddAuthenticationSchemes("ejud")
                .Build());

            options.AddPolicy("Judicial", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.JudgeRole, AppRoles.JudicialOfficeHolderRole)
                .AddAuthenticationSchemes("vhaad")
                .AddAuthenticationSchemes("ejud")
                .Build());

            options.AddPolicy("Individual", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.CitizenRole, AppRoles.RepresentativeRole)
                .AddAuthenticationSchemes("vhaad")
                .AddAuthenticationSchemes("ejud")
                .Build());

            options.AddPolicy(AppRoles.RepresentativeRole, new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.RepresentativeRole)
                .AddAuthenticationSchemes("vhaad")
                .AddAuthenticationSchemes("ejud")
                .Build());

            options.AddPolicy(AppRoles.CitizenRole, new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(AppRoles.CitizenRole)
                .AddAuthenticationSchemes("vhaad")
                .AddAuthenticationSchemes("ejud")
                .Build());
        }

        private static void AddMvcPolicies(MvcOptions options)
        {
            options.Filters.Add(new AuthorizeFilter(new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser().Build()));
        }
    }
}
