using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using VideoWeb.AuthenticationSchemes;
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
            var azureAdConfiguration = configuration.GetSection("AzureAd").Get<AzureAdConfiguration>();
            var eJudAdConfiguration = configuration.GetSection("EJudAd").Get<EJudAdConfiguration>();
            var kinlyCallbackSecret = Convert.FromBase64String(kinlyConfiguration.CallbackSecret);
            var internalEventSecret = Convert.FromBase64String(configuration.GetValue<string>("InternalEventsSecret"));

            var providerSchemes = new List<IProviderSchemes>
            {
                new VhAadScheme(azureAdConfiguration, eventhubPath),
                new EJudiciaryScheme(eventhubPath, eJudAdConfiguration)
            };

            var authenticationBuilder = serviceCollection.AddAuthentication(options =>
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
                        else if (context.Request.Path.StartsWithSegments("/internalevent"))
                        {
                            return "InternalEvent";
                        }

                        var isEventHubRequest = context.Request.Path.StartsWithSegments("/eventhub");
                        var provider = GetProviderFromRequest(context.Request, providerSchemes);
                        return providerSchemes.Single(s => s.Provider == provider).GetScheme(isEventHubRequest);
                    };
                })
                .AddJwtBearer("Callback", options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        IssuerSigningKey = new SymmetricSecurityKey(kinlyCallbackSecret)
                    };
                })
                .AddJwtBearer("InternalEvent", options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        IssuerSigningKey = new SymmetricSecurityKey(internalEventSecret)
                    };
                });

            foreach (var scheme in providerSchemes)
            {
                authenticationBuilder = scheme.AddSchemes(authenticationBuilder);
            }

            serviceCollection.AddMemoryCache();
            serviceCollection.AddAuthPolicies(providerSchemes);
        }

        public static AuthProvider GetProviderFromRequest(HttpRequest httpRequest, IList<IProviderSchemes> providerSchemes)
        {
            var defaultScheme = AuthProvider.VHAAD;
            if (httpRequest.Headers.TryGetValue("Authorization", out var authHeader))
            {
                var jwtToken = new JwtSecurityToken(authHeader.ToString().Replace("Bearer ", string.Empty));
                return providerSchemes.SingleOrDefault(s => s.BelongsToScheme(jwtToken))?.Provider ?? defaultScheme;
            }

            return defaultScheme;
        }

        private static void AddAuthPolicies(this IServiceCollection serviceCollection, IList<IProviderSchemes> providerSchemes)
        {
            serviceCollection.AddAuthorization(options => AddPolicies(options, providerSchemes));
            serviceCollection.AddMvc(options => options.Filters.Add(new AuthorizeFilter(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())));
        }

        private static void AddPolicies(AuthorizationOptions options, IList<IProviderSchemes> schemes)
        {
            var allRoles = new[]
            {
                AppRoles.CitizenRole, AppRoles.JudgeRole, AppRoles.RepresentativeRole, AppRoles.CaseAdminRole,
                AppRoles.VhOfficerRole, AppRoles.JudicialOfficeHolderRole
            };

            var rolePolicies = new Dictionary<string, string[]>
            {
                [AppRoles.JudgeRole] = new[] { AppRoles.JudgeRole },
                [AppRoles.VhOfficerRole] = new[] { AppRoles.VhOfficerRole },
                ["Judicial"] = new[] { AppRoles.JudgeRole, AppRoles.JudicialOfficeHolderRole },
                ["Individual"] = new[] { AppRoles.CitizenRole, AppRoles.RepresentativeRole },
                [AppRoles.RepresentativeRole] = new[] { AppRoles.RepresentativeRole },
                [AppRoles.CitizenRole] = new[] { AppRoles.CitizenRole }
            };

            options.AddPolicy("Callback", new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddAuthenticationSchemes("Callback")
                .Build());

            foreach (var scheme in schemes.SelectMany(s => s.GetProviderSchemes()))
            {
                options.AddPolicy(scheme, new AuthorizationPolicyBuilder()
               .RequireAuthenticatedUser()
               .RequireRole(allRoles)
               .AddAuthenticationSchemes(scheme)
               .Build());
            }

            foreach (var policy in rolePolicies)
            {
                var policyBuilder = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireRole(policy.Value);

                // TODO: These didnt use to include the EventHubSchemes but should they have?
                foreach (var schemeName in schemes.Select(s => s.SchemeName))
                {
                    policyBuilder = policyBuilder.AddAuthenticationSchemes(schemeName);
                }

                options.AddPolicy(policy.Key, policyBuilder.Build());
            }            
        }
    }
}
