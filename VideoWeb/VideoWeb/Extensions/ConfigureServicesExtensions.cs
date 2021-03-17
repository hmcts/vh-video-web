using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyModel;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using Polly;
using Polly.Extensions.Http;
using Swashbuckle.AspNetCore.Swagger;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Helpers;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.SignalR;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Mappers;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Decorators;
using VideoWeb.Mappings.Interfaces;
using VideoWeb.Middleware;
using BookingsApi.Client;
using UserApi.Client;
using VideoApi.Client;
using VideoWeb.Services;
using VideoWeb.Swagger;

namespace VideoWeb.Extensions
{
    public static class ConfigureServicesExtensions
    {
        public static IServiceCollection AddSwagger(this IServiceCollection serviceCollection)
        {
            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);

            var contractsXmlFile = $"{typeof(AddMediaEventRequest).Assembly.GetName().Name}.xml";
            var contractsXmlPath = Path.Combine(AppContext.BaseDirectory, contractsXmlFile);

            serviceCollection.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Video Web App API", Version = "v1" });
                c.AddFluentValidationRules();
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
            serviceCollection.AddSwaggerGenNewtonsoftSupport();

            return serviceCollection;
        }

        public static IServiceCollection AddCustomTypes(this IServiceCollection services)
        {
            services.AddScoped<CheckParticipantCanAccessConferenceAttribute>();

            services.AddControllers().AddControllersAsServices();

            services.AddMemoryCache();

            services.AddSingleton<ITelemetryInitializer, RequestTelemetry>();

            services.AddTransient<BookingsApiTokenHandler>();
            services.AddTransient<VideoApiTokenHandler>();
            services.AddTransient<UserApiTokenHandler>();

            services.AddSingleton<IUserIdProvider, NameUserIdProvider>();
            services.AddScoped<ITokenProvider, TokenProvider>();
            services.AddScoped<ICustomJwtTokenProvider, CustomJwtTokenProvider>();
            services.AddScoped<IHashGenerator, HashGenerator>();
            services.AddScoped<AdUserProfileService>();
            services.AddScoped<IUserProfileService, CachedProfileService>();
            services.AddScoped<IConferenceCache, DistributedConferenceCache>();
            services.AddScoped<IMessageDecoder, MessageFromDecoder>();
            services.AddScoped<IHeartbeatRequestMapper, HeartbeatRequestMapper>();
            services.AddSingleton<IUserCache, DistributedUserCache>();
            services.AddScoped<ILoggingDataExtractor, LoggingDataExtractor>();
            services.AddScoped<IConsultationResponseTracker, ConsultationResponseTracker>();
            services.AddScoped<IConsultationNotifier, ConsultationNotifier>();

            RegisterMappers(services);

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

            services.AddHttpClient<IUserApiClient, UserApiClient>()
                .AddHttpMessageHandler<UserApiTokenHandler>()
                .AddTypedClient(httpClient => BuildUserApiClient(httpClient, servicesConfiguration));

            services.AddScoped<IEventHandlerFactory, EventHandlerFactory>();
            RegisterEventHandlers(services);

            var contractResolver = new DefaultContractResolver
            {
                NamingStrategy = new SnakeCaseNamingStrategy()
            };

            var connectionStrings = container.GetService<ConnectionStrings>();
            services.AddSignalR().AddAzureSignalR(connectionStrings.SignalR)
                .AddNewtonsoftJsonProtocol(options =>
                {
                    options.PayloadSerializerSettings.Formatting = Formatting.None;
                    options.PayloadSerializerSettings.ContractResolver = contractResolver;
                    options.PayloadSerializerSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;
                    options.PayloadSerializerSettings.Converters.Add(
                        new StringEnumConverter());
                })
                .AddHubOptions<EventHub.Hub.EventHub>(options => { options.EnableDetailedErrors = true; });

            services.AddStackExchangeRedisCache(options => { options.Configuration = connectionStrings.RedisCache; });
            return services;
        }

        private static void RegisterMappers(IServiceCollection serviceCollection)
        {
            serviceCollection.AddScoped<IMapperFactory, MapperFactory>();

            serviceCollection.Scan(scan => scan.FromAssembliesOf(typeof(IMapTo<,>))
                .AddClasses(classes => classes.AssignableTo(typeof(IMapTo<,>))
                    .Where(_ => !_.IsGenericType))
                .AsImplementedInterfaces()
                .WithTransientLifetime());
            serviceCollection.TryDecorate(typeof(IMapTo<,>), typeof(MapperLoggingDecorator<,>));

            serviceCollection.Scan(scan => scan.FromAssembliesOf(typeof(IMapTo<,,>))
                .AddClasses(classes => classes.AssignableTo(typeof(IMapTo<,,>))
                    .Where(_ => !_.IsGenericType))
                .AsImplementedInterfaces()
                .WithTransientLifetime());
            serviceCollection.TryDecorate(typeof(IMapTo<,,>), typeof(MapperLoggingDecorator<,,>));

            serviceCollection.Scan(scan => scan.FromAssembliesOf(typeof(IMapTo<,,,>))
                .AddClasses(classes => classes.AssignableTo(typeof(IMapTo<,,,>))
                    .Where(_ => !_.IsGenericType))
                .AsImplementedInterfaces()
                .WithTransientLifetime());
            serviceCollection.TryDecorate(typeof(IMapTo<,,,>), typeof(MapperLoggingDecorator<,,,>));

            serviceCollection.Scan(scan => scan.FromAssembliesOf(typeof(IMapTo<,,,,>))
                .AddClasses(classes => classes.AssignableTo(typeof(IMapTo<,,,,>))
                    .Where(_ => !_.IsGenericType))
                .AsImplementedInterfaces()
                .WithTransientLifetime());
            serviceCollection.TryDecorate(typeof(IMapTo<,,,,>), typeof(MapperLoggingDecorator<,,,,>));

            serviceCollection.Scan(scan => scan.FromAssembliesOf(typeof(IMapTo<,,,,,>))
                .AddClasses(classes => classes.AssignableTo(typeof(IMapTo<,,,,,>))
                    .Where(_ => !_.IsGenericType))
                .AsImplementedInterfaces()
                .WithTransientLifetime());
            serviceCollection.TryDecorate(typeof(IMapTo<,,,,,>), typeof(MapperLoggingDecorator<,,,,,>));
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
            var runtimeAssemblyNames = DependencyContext.Default.GetRuntimeAssemblyNames(platform);

            return runtimeAssemblyNames
                .Select(Assembly.Load)
                .SelectMany(a => a.ExportedTypes)
                .Where(t => typeof(T).IsAssignableFrom(t));
        }

        public static IServiceCollection AddJsonOptions(this IServiceCollection serviceCollection)
        {
            var contractResolver = new DefaultContractResolver
            {
                NamingStrategy = new SnakeCaseNamingStrategy()
            };

            serviceCollection.AddMvc()
                .AddNewtonsoftJson(options =>
                {
                    options.SerializerSettings.ContractResolver = contractResolver;
                    options.SerializerSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;
                    options.SerializerSettings.Converters.Add(new StringEnumConverter());
                });

            return serviceCollection;
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

        private static IUserApiClient BuildUserApiClient(HttpClient httpClient,
            HearingServicesConfiguration serviceSettings)
        {
            return UserApiClient.GetClient(serviceSettings.UserApiUrl, httpClient);
        }
    }
}
