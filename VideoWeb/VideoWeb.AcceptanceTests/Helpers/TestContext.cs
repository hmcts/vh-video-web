using System.Collections.Generic;
using AcceptanceTests.Common.Configuration.Users;
using AcceptanceTests.Common.Driver;
using RestSharp;
using VideoWeb.AcceptanceTests.Configuration;
using Test = VideoWeb.AcceptanceTests.Data.Test;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public class TestContext
    {
        public RestRequest Request { get; set; }
        public IRestResponse Response { get; set; }


        public Apis Apis { get; set; }
        public UserAccount CurrentUser { get; set; }
        public DriverSetup Driver { get; set; }
        public Test Test { get; set; }
        public VideoWebTokens Tokens { get; set; }
        public List<UserAccount> UserAccounts { get; set; }
        public VideoWebConfig VideoWebConfig { get; set; }





        public RestClient VideoApiClient()
        {
            var client = new RestClient(VideoWebConfig.VhServices.VideoApiUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {Tokens.VideoApiBearerToken}");
            return client;
        }

        public RestRequest Get(string path) => new RestRequest(path, Method.GET);


    }
}