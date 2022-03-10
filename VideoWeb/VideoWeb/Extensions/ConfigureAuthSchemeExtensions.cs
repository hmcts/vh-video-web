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
using Microsoft.Net.Http.Headers;

namespace VideoWeb.Extensions
{
    public static class ConfigureAuthSchemeExtensions
    {
        public static void RegisterAuthSchemes(this IServiceCollection serviceCollection, IConfiguration configuration)
        {
            //var eJudFeatureFlag = configuration.GetValue<bool>("FeatureFlags:EJudFeature"); 
            var eJudFeatureFlag = serviceCollection.BuildServiceProvider().GetRequiredService<IBookingsApiClient>().GetFeatureFlagAsync("EJudFeature").Result;
            var eJudAdConfiguration = configuration.GetSection("EJudAd").Get<EJudAdConfiguration>();

            var kinlyConfiguration = configuration.GetSection("KinlyConfiguration").Get<KinlyConfiguration>();
            var azureAdConfiguration = configuration.GetSection("AzureAd").Get<AzureAdConfiguration>();
            var quickLinksConfiguration = configuration.GetSection("QuickLinks").Get<QuickLinksConfiguration>();

            var videoHearingServicesConfiguration = configuration.GetSection("VhServices").Get<HearingServicesConfiguration>();
            var eventhubPath = videoHearingServicesConfiguration.EventHubPath;
            var internalEventSecret = Convert.FromBase64String(videoHearingServicesConfiguration.InternalEventSecret);

            var kinlyCallbackSecret = Convert.FromBase64String(kinlyConfiguration.CallbackSecret);

            IProviderSchemes providerScheme; // = new VhAadScheme(azureAdConfiguration, eventhubPath);
            var aadScheme = new VhAadScheme(azureAdConfiguration, eventhubPath);
            var ejudScheme = new EJudiciaryScheme(eventhubPath, eJudAdConfiguration);
            var quickLinksScheme = new QuickLinksScheme(quickLinksConfiguration, eventhubPath, serviceCollection);

            var providerSchemes = new List<AuthProvider>()
            {
                aadScheme.Provider,
                ejudScheme.Provider,
                quickLinksScheme.Provider
            };

            serviceCollection.AddSingleton<RsaSecurityKey>(provider =>
            {
                var rsa = RSA.Create();
                rsa.ImportRSAPublicKey(
                    source: Convert.FromBase64String(quickLinksConfiguration.RsaPublicKey),
                    bytesRead: out var _
                );

                return new RsaSecurityKey(rsa);
            });

            // var authenticationBuilder =
            serviceCollection.AddAuthentication(
                        options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
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
                 })
                 .AddJwtBearer("VHAAD", options => aadScheme.SetJwtBearerOptions(options))
                .AddJwtBearer("EJudiciary", options => ejudScheme.SetJwtBearerOptions(options))
               
               
                .AddJwtBearer("QuickLinks", options => quickLinksScheme.SetJwtBearerOptions(options))


        //.AddPolicyScheme("AAD_OR_Ejud_OR_QL", "Handler", options =>
        .AddPolicyScheme(JwtBearerDefaults.AuthenticationScheme, "Handler", options =>
        
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
                var provider = GetProviderFromRequest(context.Request);
                return provider;

            //        if (provider == "VHAAD")
            //    {

                //        return "VHAAD";
                //    }
                //        if (provider == "EJudiciary")
                //    {

                //        return "EJudiciary";
                //    }
                //        if (provider == "QuickLinks")
                //    {
                //        return "QuickLinks";
                //    }
                //        return "VHAAD";
                };
            });

            serviceCollection.AddMemoryCache();
            serviceCollection.AddAuthPolicies(providerSchemes);
        }
        public static string GetProviderFromRequest(HttpRequest httpRequest)
        {
            //string authorization = httpRequest.Headers[HeaderNames.Authorization];
            //var defaultScheme = "VHAAD";
            //if (!string.IsNullOrEmpty(authorization) && authorization.StartsWith("Bearer "))
            //{
            //    var token = authorization.Substring("Bearer ".Length).Trim();
            //    var jwtHandler = new JwtSecurityTokenHandler();

            //    //if (jwtHandler.ReadJwtToken(token).Claims.First(claim => claim.Type == "role")?.Value == "QuickLinks") return "QuickLinks";
            //    return (jwtHandler.CanReadToken(token) && jwtHandler.ReadJwtToken(token).Claims.First(claim => claim.Type == "aud").Value == ejudClientId)
            //        ? "EJudiciary" : "VHAAD";
            //}
            //return defaultScheme;

            var token = string.Empty;

            if (httpRequest.Headers.TryGetValue("Authorization", out var value))
            {
                string authorization = value;
                if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    token = authorization.Substring("Bearer ".Length).Trim();
                }
            }

            var jwtHandler = new JwtSecurityTokenHandler();

            if (jwtHandler.CanReadToken(token))
            {
                var jwtToken = jwtHandler.ReadJwtToken(token);

                if (jwtToken.Issuer == "https://login.microsoftonline.com/fb6e0e22-0da3-4c35-972a-9d61eb256508/v2.0")
                {
                    return "VHAAD";
                }
                if (jwtToken.Issuer == "https://login.microsoftonline.com/0b90379d-18de-426a-ae94-7f62441231e0/v2.0")
                {
                    return "EJudiciary";
                }
            }

            return "QuickLinks";
        }

        private static void AddAuthPolicies(this IServiceCollection serviceCollection, IList<AuthProvider> authProviders)
        {
            serviceCollection.AddAuthorization(options => AddPolicies(options, authProviders));
            serviceCollection.AddMvc(options => options.Filters.Add(new AuthorizeFilter(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())));
        }

        private static void AddPolicies(AuthorizationOptions options, IList<AuthProvider> authProviders)
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

            foreach (var authProvider in authProviders)
            {
                options.AddPolicy(authProvider.ToString(), new AuthorizationPolicyBuilder()
                .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
               .RequireAuthenticatedUser()
               .RequireRole(allRoles)
               .Build());
            }

            foreach (var policy in rolePolicies)
            {
                var policyBuilder = new AuthorizationPolicyBuilder()
                 .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
                .RequireAuthenticatedUser()
                .RequireRole(policy.Value);

                // TODO: These didnt use to include the EventHubSchemes but should they have?
                //foreach (var authProvider in authProviders)
                //{
                //    policyBuilder = policyBuilder.AddAuthenticationSchemes(authProvider.ToString());
                //}

                options.AddPolicy(policy.Key, policyBuilder.Build());
            }
        }
    }
}
