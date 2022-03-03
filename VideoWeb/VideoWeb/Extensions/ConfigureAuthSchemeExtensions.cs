using System;
using System.Security.Cryptography;
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
using BookingsApi.Client;
using Microsoft.AspNetCore.Http.Extensions;

namespace VideoWeb.Extensions
{
    public static class ConfigureAuthSchemeExtensions
    {        
        public static void RegisterAuthSchemes(this IServiceCollection serviceCollection, IConfiguration configuration)
        {
            //var eJudFeatureFlag = configuration.GetValue<bool>("FeatureFlags:EJudFeature"); 
            var eJudFeatureFlag = serviceCollection.BuildServiceProvider().GetRequiredService<IBookingsApiClient>().GetFeatureFlagAsync("EJudFeature").Result;
            EJudAdConfiguration eJudAdConfiguration;

            var kinlyConfiguration = configuration.GetSection("KinlyConfiguration").Get<KinlyConfiguration>();
            var azureAdConfiguration = configuration.GetSection("AzureAd").Get<AzureAdConfiguration>();
            //var quickLinksConfiguration = configuration.GetSection("QuickLinks").Get<QuickLinksConfiguration>();

            var videoHearingServicesConfiguration = configuration.GetSection("VhServices").Get<HearingServicesConfiguration>();
            var eventhubPath = videoHearingServicesConfiguration.EventHubPath;
            var internalEventSecret = Convert.FromBase64String(videoHearingServicesConfiguration.InternalEventSecret);

            var kinlyCallbackSecret = Convert.FromBase64String(kinlyConfiguration.CallbackSecret);
            var providerSchemes = new List<IProviderSchemes>();
            if (eJudFeatureFlag)
            {
               eJudAdConfiguration = configuration.GetSection("EJudAd").Get<EJudAdConfiguration>();
               providerSchemes.Add(new EJudiciaryScheme(eventhubPath, eJudAdConfiguration));
            }

            //serviceCollection.AddSingleton<RsaSecurityKey>(provider =>
            //{
            //    var rsa = RSA.Create();
            //    rsa.ImportRSAPublicKey(
            //        source: Convert.FromBase64String(quickLinksConfiguration.RsaPublicKey),
            //        bytesRead: out var _
            //    );

            //    return new RsaSecurityKey(rsa);
            //});
            
            
            providerSchemes.Add(new VhAadScheme(azureAdConfiguration, eventhubPath));
            //providerSchemes.Add(new QuickLinksScheme(quickLinksConfiguration, eventhubPath, serviceCollection));

            


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
                AppRoles.VhOfficerRole, AppRoles.JudicialOfficeHolderRole, AppRoles.StaffMember
            };

            var rolePolicies = new Dictionary<string, string[]>
            {
                [AppRoles.JudgeRole] = new[] { AppRoles.JudgeRole },
                [AppRoles.VhOfficerRole] = new[] { AppRoles.VhOfficerRole },
                [AppRoles.VenueManagementRole] = new[] { AppRoles.VhOfficerRole, AppRoles.StaffMember },
                ["Host"] = new[] { AppRoles.JudgeRole, AppRoles.StaffMember },
                ["Judicial"] = new[] { AppRoles.JudgeRole, AppRoles.JudicialOfficeHolderRole, AppRoles.StaffMember },
                ["Individual"] = new[] { AppRoles.CitizenRole, AppRoles.RepresentativeRole, AppRoles.QuickLinkParticipant, AppRoles.QuickLinkObserver },
                [AppRoles.StaffMember] = new[] { AppRoles.StaffMember },
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

        private static void AddProviderSchemes(this string providerScheme, IList<IProviderSchemes> providerSchemes, string eventHubPath, EJudAdConfiguration eJudAdConfiguration)
        {
            //if (eJudFeatureFlag)
            //{
            //    eJudAdConfiguration = configuration.GetSection("EJudAd").Get<EJudAdConfiguration>();
            providerSchemes.Add(new EJudiciaryScheme(eventHubPath, eJudAdConfiguration));
            //}
            //providerSchemes.Add(new VhAadScheme(azureAdConfiguration, eventhubPath));

        }
    }
}
