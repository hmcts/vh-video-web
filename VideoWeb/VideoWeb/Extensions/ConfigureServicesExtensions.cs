using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyModel;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Polly;
using Polly.Extensions.Http;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Helpers;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.SignalR;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Mappers;
using VideoWeb.Helpers;
using VideoWeb.Middleware;
using BookingsApi.Client;
using MicroElements.Swashbuckle.FluentValidation.AspNetCore;
using StackExchange.Redis;
using VideoApi.Client;
using VideoWeb.Common.Security.Tokens;
using VideoWeb.Common.Security.Tokens.Vodafone;
using VideoWeb.EventHub.Services;
using VideoWeb.Swagger;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Services;
using VideoWeb.Services.BackgroundService;

namespace VideoWeb.Extensions
{
    public static class ConfigureServicesExtensions
    {
        public static void AddSwagger(this IServiceCollection serviceCollection)
        {
            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);

            var contractsXmlFile = $"{typeof(AddMediaEventRequest).Assembly.GetName().Name}.xml";
            var contractsXmlPath = Path.Combine(AppContext.BaseDirectory, contractsXmlFile);
            serviceCollection.AddFluentValidationRulesToSwagger();
            serviceCollection.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Video Web App API", Version = "v1" });
                c.IncludeXmlComments(xmlPath);
                c.IncludeXmlComments(contractsXmlPath);
                c.EnableAnnotations();
                c.CustomSchemaIds(x => x.FullName);

                c.AddSecurityDefinition("Bearer", //Name the security scheme
                    new OpenApiSecurityScheme
                    {
                        Description = "JWT Authorization header using the Bearer scheme.",
                        Type = SecuritySchemeType.Http, //We set the scheme type to http since we're using bearer authentication
                        Scheme = "bearer" //The name of the HTTP Authorization scheme to be used in the Authorization header. In this case "bearer".
                    });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement{
                    {
                        new OpenApiSecurityScheme{
                            Reference = new OpenApiReference{
                                Id = "Bearer", //The name of the previously defined security scheme.
                                Type = ReferenceType.SecurityScheme
                            }
                        },new List<string>()
                    }
                });
                c.OperationFilter<AuthResponsesOperationFilter>();
            });
        }

        public static IServiceCollection AddCustomTypes(this IServiceCollection services)
        {
            services.AddScoped<CheckParticipantCanAccessConferenceAttribute>();
            services.AddControllers().AddControllersAsServices();
            services.AddMemoryCache();
            services.AddTransient<BookingsApiTokenHandler>();
            services.AddTransient<VideoApiTokenHandler>();
            services.AddSingleton<IUserIdProvider, NameUserIdProvider>();
            services.AddScoped<ITokenProvider, TokenProvider>();
            services.AddScoped<IVodafoneJwtTokenProvider, VodafoneJwtTokenProvider>();
            services.AddScoped<IHashGenerator, VodafoneHashGenerator>();
            services.AddScoped<IAppRoleService, AppRoleService>();
            services.AddScoped<IUserProfileService, UserProfileService>();
            services.AddScoped<IUserProfileCache, DistributedUserProfileCache>();
            services.AddScoped<IUserClaimsCache, DistributedUserClaimsCache>();
            services.AddScoped<IConferenceCache, DistributedConferenceCache>();
            services.AddScoped<IMessageDecoder, MessageFromDecoder>();
            services.AddScoped<IHeartbeatRequestMapper, HeartbeatRequestMapper>();
            services.AddSingleton<IUserProfileCache, DistributedUserProfileCache>();
            services.AddSingleton<ITestCallCache, DistributedTestCallCache>();
            services.AddScoped<ILoggingDataExtractor, LoggingDataExtractor>();
            services.AddScoped<IConsultationInvitationCache, DistributedConsultationInvitationCache>();
            services.AddScoped<IConsultationInvitationTracker, ConsultationInvitationTracker>();
            services.AddScoped<IConsultationNotifier, ConsultationNotifier>();
            services.AddScoped<IHearingLayoutService, HearingLayoutService>();
            services.AddScoped<IHearingLayoutCache, DistributedHearingLayoutCache>();
            services.AddScoped<IConferenceVideoControlStatusService, ConferenceVideoControlStatusService>();
            services.AddScoped<IConferenceVideoControlStatusCache, DistributedConferenceVideoControlStatusCache>();
            services.AddScoped<IParticipantService, ParticipantService>();
            services.AddScoped<IDistributedJohConsultationRoomLockCache, DistributedJohConsultationRoomLockCache>();
            services.AddScoped<IConferenceManagementService, ConferenceManagementService>();
            services.AddScoped<ISupplierPlatformServiceFactory, SupplierPlatformServiceFactory>();
            services.AddScoped<IConferenceService, ConferenceService>();
            services.AddScoped<IReferenceDataService, ReferenceDataService>();
            services.AddScoped<IConferenceLoaderService, ConferenceLoaderService>();
            services.AddSingleton<ICacheLock, CacheLock>();

            var container = services.BuildServiceProvider();
            var servicesConfiguration = container.GetService<IOptions<HearingServicesConfiguration>>().Value;

            services.AddHttpClient<IBookingsApiClient, BookingsApiClient>()
                .AddHttpMessageHandler<BookingsApiTokenHandler>()
                .AddTypedClient(httpClient => BuildBookingsApiClient(httpClient, servicesConfiguration))
                .AddPolicyHandler(GetRetryPolicy())
                .AddPolicyHandler(GetCircuitBreakerPolicy());

            services.AddHttpClient<IVideoApiClient, VideoApiClient>()
                .AddHttpMessageHandler<VideoApiTokenHandler>()
                .AddTypedClient(httpClient => BuildVideoApiClient(httpClient, servicesConfiguration));

            services.AddScoped<IEventHandlerFactory, EventHandlerFactory>();
            services.AddScoped<IParticipantsUpdatedEventNotifier, ParticipantsUpdatedEventNotifier>();
            services.AddScoped<IEndpointsUpdatedEventNotifier, EndpointsUpdatedEventNotifier>();
            services.AddScoped<INewConferenceAddedEventNotifier, NewConferenceAddedEventNotifier>();
            services.AddScoped<IAllocationHearingsEventNotifier, AllocationHearingsEventNotifier>();
            services.AddScoped<IHearingCancelledEventNotifier, HearingCancelledEventNotifier>();
            services.AddScoped<IHearingDetailsUpdatedEventNotifier, HearingDetailsUpdatedEventNotifier>();
            RegisterEventHandlers(services);

            var connectionStrings = container.GetService<ConnectionStrings>();
            services.AddSignalR()
                .AddAzureSignalR(options =>
                {
                    options.ConnectionString = connectionStrings.SignalR;
                    options.ClaimsProvider = context => context.User.Claims;
                })
                .AddJsonProtocol(options =>
                {
                    options.PayloadSerializerOptions.WriteIndented = false; 
                    options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
                    options.PayloadSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
                    options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()); 
                })
                .AddHubOptions<EventHub.Hub.EventHub>(options => 
                { 
                    options.EnableDetailedErrors = true;
                    options.ClientTimeoutInterval = TimeSpan.FromMilliseconds(60000);
                    options.KeepAliveInterval = TimeSpan.FromMilliseconds(30000);
                });

            var redisConfig = container.GetService<RedisConfiguration>();
            services.AddStackExchangeRedisCache(options =>
            {
                options.ConfigurationOptions = new ConfigurationOptions
                {
                    EndPoints = { redisConfig.Endpoint },
                    Password = redisConfig.Password,
                    ConnectRetry = 1,
                    BacklogPolicy = BacklogPolicy.FailFast,
                    AbortOnConnectFail = false,
                    ConnectTimeout = 3000,
                    Ssl = true,
                };
            });
            services.AddHostedService<ConferenceBackgroundService>();
            return services;
        }

        private static void RegisterEventHandlers(IServiceCollection serviceCollection)
        {
            var eventHandlers = GetAllTypesOf<IEventHandler>();

            foreach (var eventHandler in eventHandlers)
            {
                if (eventHandler.IsInterface || eventHandler.IsAbstract) continue;
                var serviceType = eventHandler.GetInterfaces()[0];
                serviceCollection.AddScoped(serviceType, eventHandler);
            }
        }

        private static IEnumerable<Type> GetAllTypesOf<T>()
        {
            var platform = Environment.OSVersion.Platform.ToString();
            var runtimeAssemblyNames = DependencyContext.Default!.GetRuntimeAssemblyNames(platform);

            return runtimeAssemblyNames
                .Select(Assembly.Load)
                .SelectMany(a => a.ExportedTypes)
                .Where(t => typeof(T).IsAssignableFrom(t));
        }

        public static void AddJsonOptions(this IServiceCollection serviceCollection)
        {
            serviceCollection.AddMvc()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
                });
        }

        private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
        }

        private static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .CircuitBreakerAsync(3, TimeSpan.FromSeconds(30));
        }

        private static IBookingsApiClient BuildBookingsApiClient(HttpClient httpClient,
            HearingServicesConfiguration servicesConfiguration)
        {
            return BookingsApiClient.GetClient(servicesConfiguration.BookingsApiUrl, httpClient);
        }

        private static IVideoApiClient BuildVideoApiClient(HttpClient httpClient,
            HearingServicesConfiguration serviceSettings)
        {
            return VideoApiClient.GetClient(serviceSettings.VideoApiUrl, httpClient);
        }
    }
}
