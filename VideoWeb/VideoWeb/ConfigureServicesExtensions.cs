using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Serialization;
using Swashbuckle.AspNetCore.Swagger;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;
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

            services.AddTransient<BookingsApiTokenHandler>();
            services.AddTransient<VideoApiTokenHandler>();
            services.AddTransient<UserApiTokenHandler>();
            services.AddScoped<ITokenProvider, TokenProvider>();

            var container = services.BuildServiceProvider();
            var servicesConfiguration = container.GetService<IOptions<HearingServicesConfiguration>>().Value;


            services.AddHttpClient<IBookingsApiClient, BookingsApiClient>()
                .AddHttpMessageHandler(() => container.GetService<BookingsApiTokenHandler>())
                .AddTypedClient(httpClient => BuildBookingsApiClient(httpClient, servicesConfiguration));
            
            services.AddHttpClient<IVideoApiClient, VideoApiClient>()
                .AddHttpMessageHandler(() => container.GetService<VideoApiTokenHandler>())
                .AddTypedClient(httpClient => BuildVideoApiClient(httpClient, servicesConfiguration));
            
            services.AddHttpClient<IUserApiClient, UserApiClient>()
                .AddHttpMessageHandler(() => container.GetService<UserApiTokenHandler>())
                .AddTypedClient(httpClient => BuildUserApiClient(httpClient, servicesConfiguration));
            
            return services;
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

        public static IServiceCollection AddJsonOptions(this IServiceCollection serviceCollection)
        {
            var contractResolver = new DefaultContractResolver
            {
                NamingStrategy = new SnakeCaseNamingStrategy()
            };

            serviceCollection.AddMvc()
                .AddJsonOptions(options => options.SerializerSettings.ContractResolver = contractResolver)
                .AddJsonOptions(options =>
                    options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter()));

            return serviceCollection;
        }
    }
}