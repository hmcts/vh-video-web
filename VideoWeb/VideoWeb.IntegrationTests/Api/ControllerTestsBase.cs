using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using NUnit.Framework;
using Testing.Common.Configuration;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;
using AzureAdConfiguration = VideoWeb.Common.Configuration.AzureAdConfiguration;

namespace VideoWeb.IntegrationTests.Api
{
    public abstract class ControllerTestsBase
    {
        private TestServer _server;
        private string _bearerToken;

        [OneTimeSetUp]
        public void OneTimeSetup()
        {
            var webHostBuilder = WebHost.CreateDefaultBuilder()
                .UseKestrel(c => c.AddServerHeader = false)
                .UseEnvironment("Development")
                .UseStartup<Startup>();
            _server = new TestServer(webHostBuilder);
            GetClientAccessTokenForApi();
        }
        
        private void GetClientAccessTokenForApi()
        {
            var configRootBuilder = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .AddEnvironmentVariables()
                .AddUserSecrets<Startup>();
            
            var configRoot = configRootBuilder.Build();
            
            var azureAdConfigurationOptions = Options.Create(configRoot.GetSection("AzureAd").Get<AzureAdConfiguration>());
            var testSettingsOptions = Options.Create(configRoot.GetSection("Testing").Get<TestSettings>());
            
            var azureAdConfiguration = azureAdConfigurationOptions.Value;
            var testSettings = testSettingsOptions.Value;

            _bearerToken = new TokenProvider(azureAdConfigurationOptions).GetClientAccessToken(
                testSettings.TestClientId, testSettings.TestClientSecret, azureAdConfiguration.ClientId);
        }

        protected async Task<HttpResponseMessage> SendGetRequestAsync(string uri)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.GetAsync(uri);
            }
        }

        protected async Task<HttpResponseMessage> SendPostRequestAsync(string uri, HttpContent httpContent)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.PostAsync(uri, httpContent);
            }
        }

        protected async Task<HttpResponseMessage> SendPatchRequestAsync(string uri, StringContent httpContent)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.PatchAsync(uri, httpContent);
            }
        }

        protected async Task<HttpResponseMessage> SendPutRequestAsync(string uri, StringContent httpContent)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.PutAsync(uri, httpContent);
            }
        }

        protected async Task<HttpResponseMessage> SendDeleteRequestAsync(string uri)
        {
            using (var client = _server.CreateClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {_bearerToken}");
                return await client.DeleteAsync(uri);
            }
        }

        [OneTimeTearDown]
        public void OneTimeTearDown()
        {
            _server.Dispose();
        }
    }
}