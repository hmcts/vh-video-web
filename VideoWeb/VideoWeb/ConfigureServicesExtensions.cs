using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyModel;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using Polly;
using Polly.Extensions.Http;
using Swashbuckle.AspNetCore.Swagger;
using VideoWeb.Common;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.Services;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;
using VideoWeb.Swagger;

namespace VideoWeb
{
    public static class ConfigureServicesExtensions
    {
        public static IServiceCollection AddSwagger(this IServiceCollection serviceCollection)
        {
            serviceCollection.AddSwaggerGen(c =>
            {
                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                c.IncludeXmlComments(xmlPath);

                c.SwaggerDoc("v1", new Info {Title = "Video App", Version = "v1"});
                c.EnableAnnotations();

                c.OperationFilter<AuthResponsesOperationFilter>();

                c.AddSecurityDefinition("Bearer",
                    new ApiKeyScheme
                    {
                        In = "header", Description = "Please enter JWT with Bearer into field", Name = "Authorization",
                        Type = "apiKey"
                    });
                c.AddSecurityRequirement(new Dictionary<string, IEnumerable<string>>
                {
                    {"Bearer", Enumerable.Empty<string>()},
                });
                c.SchemaFilter<EnumSchemaFilter>();
            });

            return serviceCollection;
        }

        public static IServiceCollection AddCustomTypes(this IServiceCollection services)
        {
            services.AddMemoryCache();
            
            services.AddSingleton<ITelemetryInitializer, RequestTelemetry>();

            services.AddTransient<BookingsApiTokenHandler>();
            services.AddTransient<VideoApiTokenHandler>();
            services.AddTransient<UserApiTokenHandler>();
            services.AddScoped<VideoCallbackTokenHandler>();
            
            services.AddScoped<ITokenProvider, TokenProvider>();
            services.AddScoped<ICustomJwtTokenProvider, CustomJwtTokenProvider>();
            services.AddScoped<IHashGenerator, HashGenerator>();
            services.AddScoped<IUserProfileService, AdUserProfileService>();
            
            var container = services.BuildServiceProvider();
            var servicesConfiguration = container.GetService<IOptions<HearingServicesConfiguration>>().Value;


            services.AddHttpClient<IBookingsApiClient, BookingsApiClient>()
                .AddHttpMessageHandler(() => container.GetService<BookingsApiTokenHandler>())
                .AddTypedClient(httpClient => BuildBookingsApiClient(httpClient, servicesConfiguration))
                .AddPolicyHandler(GetRetryPolicy())
                .AddPolicyHandler(GetCircuitBreakerPolicy());
            
            services.AddHttpClient<IVideoApiClient, VideoApiClient>()
                .AddHttpMessageHandler(() => container.GetService<VideoApiTokenHandler>())
                .AddTypedClient(httpClient => BuildVideoApiClient(httpClient, servicesConfiguration));
            
            services.AddHttpClient<IUserApiClient, UserApiClient>()
                .AddHttpMessageHandler(() => container.GetService<UserApiTokenHandler>())
                .AddTypedClient(httpClient => BuildUserApiClient(httpClient, servicesConfiguration));

            services.AddHttpClient<IEventsServiceClient, EventServiceClient>()
                .AddHttpMessageHandler<VideoCallbackTokenHandler>();
            
            services.AddScoped<IEventHandlerFactory, EventHandlerFactory>();
            RegisterEventHandlers(services);
                
            var contractResolver = new DefaultContractResolver
            {
                NamingStrategy = new SnakeCaseNamingStrategy()
            };
            
            services.AddSignalR()
                .AddJsonProtocol(options =>
                {
                    options.PayloadSerializerSettings.ContractResolver = contractResolver;
                    options.PayloadSerializerSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;
                    options.PayloadSerializerSettings.Converters.Add(
                        new StringEnumConverter());
                }).AddHubOptions<EventHub.Hub.EventHub>(options => { options.EnableDetailedErrors = true; });
            
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
                .AddJsonOptions(options => {
                    options.SerializerSettings.ContractResolver = contractResolver;
                    options.SerializerSettings.DateTimeZoneHandling = Newtonsoft.Json.DateTimeZoneHandling.Utc;
                }).AddJsonOptions(options =>
                    options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter()));

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
            return new BookingsApiClient(httpClient) {BaseUrl = servicesConfiguration.BookingsApiUrl};
        }

        private static IVideoApiClient BuildVideoApiClient(HttpClient httpClient,
            HearingServicesConfiguration serviceSettings)
        {
            return new VideoApiClient(httpClient) {BaseUrl = serviceSettings.VideoApiUrl};
        }

        private static IUserApiClient BuildUserApiClient(HttpClient httpClient,
            HearingServicesConfiguration serviceSettings)
        {
            return new UserApiClient(httpClient) {BaseUrl = serviceSettings.UserApiUrl};
        }
    }
}