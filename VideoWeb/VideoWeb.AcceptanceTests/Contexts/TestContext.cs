using System;
using System.Collections.Generic;
using System.Linq;
using RestSharp;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Configuration;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using TestSettings = Testing.Common.Configuration.TestSettings;

namespace VideoWeb.AcceptanceTests.Contexts
{
    public class TestContext
    {
        public RestRequest Request { get; set; }
        public IRestResponse Response { get; set; }
        public BookNewHearingRequest RequestBody { get; set; }
        public IRestResponse Responses { get; set; }
        public string BookingsApiBearerToken { get; set; }
        public string VideoApiBearerToken { get; set; }
        public string BookingsApiBaseUrl { get; set; }
        public string VideoApiBaseUrl { get; set; }
        public string VideoWebUrl { get; set; }
        public string Json { get; set; }
        public UserAccount CurrenUser { get; set; }
        public int DelayedStartTime { get; set; }
        public HearingDetailsResponse Hearing { get; set; }
        public Guid? NewHearingId { get; set; }
        public ConferenceDetailsResponse Conference { get; set; }
        public Guid? NewConferenceId { get; set; }
        public TestSettings TestSettings { get; set; }
        public SeleniumEnvironment Environment { get; set; }

        public UserAccount GetJudgeUser()
        {
            return TestSettings.UserAccounts.First(x => x.Role.StartsWith("Judge"));
        }

        public UserAccount GetCaseAdminUser()
        {
            return TestSettings.UserAccounts.First(x => x.Role.StartsWith("Case admin"));
        }

        public UserAccount GetVideoHearingOfficerUser()
        {
            return TestSettings.UserAccounts.First(x => x.Role.StartsWith("Video hearings officer"));
        }

        public UserAccount GetClerkUser()
        {
            return TestSettings.UserAccounts.First(x => x.Role.StartsWith("Clerk"));
        }

        public List<UserAccount> GetIndividualUsers()
        {
            return TestSettings.UserAccounts.Where(x => x.Role.StartsWith("Individual")).ToList();
        }

        public List<UserAccount> GetRepresentativeUsers()
        {
            return TestSettings.UserAccounts.Where(x => x.Role.StartsWith("Representative")).ToList();
        }

        public RestClient BookingsApiClient()
        {
            var client = new RestClient(BookingsApiBaseUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {BookingsApiBearerToken}");
            return client;
        }

        public RestClient VideoApiClient()
        {
            var client = new RestClient(VideoApiBaseUrl);
            client.AddDefaultHeader("Accept", "application/json");
            client.AddDefaultHeader("Authorization", $"Bearer {VideoApiBearerToken}");
            return client;
        }

        public RestRequest Get(string path) => new RestRequest(path, Method.GET);

        public RestRequest Post(string path, object requestBody)
        {
            var request = new RestRequest(path, Method.POST);
            request.AddParameter("Application/json", ApiRequestHelper.SerialiseRequestToSnakeCaseJson(requestBody),
                ParameterType.RequestBody);
            return request;
        }

        public RestRequest Delete(string path) => new RestRequest(path, Method.DELETE);

        public RestRequest Put(string path, object requestBody)
        {
            var request = new RestRequest(path, Method.PUT);
            request.AddParameter("Application/json", ApiRequestHelper.SerialiseRequestToSnakeCaseJson(requestBody),
                ParameterType.RequestBody);
            return request;
        }

        public RestRequest Patch(string path, object requestBody = null)
        {
            var request = new RestRequest(path, Method.PATCH);
            request.AddParameter("Application/json", ApiRequestHelper.SerialiseRequestToSnakeCaseJson(requestBody),
                ParameterType.RequestBody);
            return request;
        }
    }
}