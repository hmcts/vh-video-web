using System.Collections.Generic;
using System.Data;
using System.Linq;
using AcceptanceTests.Common.Api.Requests;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver;
using Microsoft.Extensions.Options;
using RestSharp;
using VideoWeb.AcceptanceTests.Configuration;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using Test = VideoWeb.AcceptanceTests.Data.Test;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class TestContext
    {
        public RestRequest Request { get; set; }
        public IRestResponse Response { get; set; }
        public string CallbackBearerToken { get; set; }
        public int DelayedStartTime { get; set; }
        public HearingDetailsResponse Hearing { get; set; }
        public ConferenceDetailsResponse Conference { get; set; }
        public CustomTokenSettings CustomTokenSettings { get; set; }



        public UserAccount CurrentUser { get; set; }
        public DriverSetup Driver { get; set; }
        public Test Test { get; set; }
        public VideoWebTokens Tokens { get; set; }
        public List<UserAccount> UserAccounts { get; set; }
        public VideoWebConfig VideoWebConfig { get; set; }

        public string CaseName()
        {
            return Test.Hearing.Cases.First().Name;
        }

        public string CaseNumber()
        {
            return Test.Hearing.Cases.First().Number;
        }

        public RestClient BookingsApiClient()
        {
            var client = new RestClient(VideoWebConfig.VhServices.BookingsApiUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {Tokens.BookingsApiBearerToken}");
            return client;
        }

        public RestClient UserApiClient()
        {
            var client = new RestClient(VideoWebConfig.VhServices.UserApiUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {Tokens.UserApiBearerToken}");
            return client;
        }

        public RestClient VideoApiClient()
        {
            var client = new RestClient(VideoWebConfig.VhServices.VideoApiUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {Tokens.VideoApiBearerToken}");
            return client;
        }

        public RestClient VideoApiEventCallbackClient()
        {
            var client = new RestClient(VideoWebConfig.VhServices.VideoApiUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {CallbackBearerToken}");
            return client;
        }

        public RestClient VideoWebEventCallbackClient()
        {
            var client = new RestClient(VideoWebConfig.VhServices.VideoWebUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {CallbackBearerToken}");
            return client;
        }

        public RestClient VideoWebClient()
        {
            var client = new RestClient(VideoWebConfig.VhServices.VideoWebUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {Tokens.VideoWebBearerToken}");
            return client;
        }

        public RestRequest Get(string path) => new RestRequest(path, Method.GET);

        public RestRequest Post(string path, object requestBody)
        {
            var request = new RestRequest(path, Method.POST);
            request.AddParameter("Application/json", RequestHelper.SerialiseRequestToSnakeCaseJson(requestBody),
                ParameterType.RequestBody);
            return request;
        }

        public RestRequest Delete(string path) => new RestRequest(path, Method.DELETE);

        public RestRequest Put(string path, object requestBody)
        {
            var request = new RestRequest(path, Method.PUT);
            request.AddParameter("Application/json", RequestHelper.SerialiseRequestToSnakeCaseJson(requestBody),
                ParameterType.RequestBody);
            return request;
        }

        public RestRequest Patch(string path, object requestBody = null)
        {
            var request = new RestRequest(path, Method.PATCH);
            request.AddParameter("Application/json", RequestHelper.SerialiseRequestToSnakeCaseJson(requestBody),
                ParameterType.RequestBody);
            return request;
        }

        public void SetDefaultVideoWebBearerToken()
        {
            //Tokens.VideoWebBearerToken = new TokenProvider(Options.Create(VideoWebConfig.AzureAdConfiguration)).GetClientAccessToken(
            //    VideoWebConfig.AzureAdConfiguration.ClientId, VideoWebConfig.AzureAdConfiguration.ClientSecret,
            //    VideoWebConfig.AzureAdConfiguration.ClientId);
        }

        public void SetCustomJwTokenForCallback()
        {
            var generateTokenWithAsciiKey = new CustomJwtTokenProvider(CustomTokenSettings).GenerateTokenForCallbackEndpoint("VhVideoApi", 2);
            CallbackBearerToken = generateTokenWithAsciiKey;
        }
    }
}