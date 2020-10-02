using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using AcceptanceTests.Common.Api.Helpers;
using FluentAssertions;
using NUnit.Framework;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Services.TestApi;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class DataSetupSteps
    {
        private const int DEFAULT_INDIVIDUALS_WITH_REPRESENTATIVES = 2;
        private const int DEFAULT_PANEL_MEMBERS = 0;
        private const int DEFAULT_OBSERVERS = 0;
        private const string DEFAULT_VENUE = "Birmingham Civil and Family Justice Centre";
        private const int ALLOCATE_USERS_FOR_MINUTES = 8;
        private const int ALLOCATE_USERS_FOR_HEARING_TESTS = 15;
        private readonly TestContext _c;
        private readonly ScenarioContext _scenario;

        public DataSetupSteps(TestContext c, ScenarioContext scenario)
        {
            _c = c;
            _scenario = scenario;
        }

        [Given(@"I have a hearing")]
        [Given(@"I have a hearing with a Judge")]
        [Given(@"I have another hearing with another Judge")]
        public void GivenIHaveAHearingAndAConference()
        {
            var userTypes = CreateUserTypes();
            AllocateUsers(userTypes);
            GivenIHaveAHearing();
            CreateConference();
        }

        [Given(@"I have another hearing")]
        public void GivenIHaveAnotherHearingAndAConference()
        {
            GivenIHaveAHearing();
            CreateConference();
        }

        [Given(@"I have a hearing in (.*) minutes time")]
        public void GivenIHaveAHearingAndAConferenceInMinutesTime(int minutes)
        {
            CheckThatTheHearingWillBeCreatedForToday(_c.TimeZone.AdjustAnyOS(DateTime.Now.ToUniversalTime().AddMinutes(minutes)));
            var userTypes = CreateUserTypes();
            AllocateUsers(userTypes);
            GivenIHaveAHearing(minutes);
            CreateConference();
            _c.Test.DelayedStartTime = minutes;
        }

        [Given(@"I have another hearing in (.*) minutes time")]
        public void GivenIHaveAnotherHearingAndAConferenceInMinutesTime(int minutes)
        {
            CheckThatTheHearingWillBeCreatedForToday(_c.TimeZone.AdjustAnyOS(DateTime.Now.ToUniversalTime().AddMinutes(minutes)));
            GivenIHaveAHearing(minutes);
            CreateConference();
            _c.Test.DelayedStartTime = minutes;
        }

        [Given(@"I have a hearing in (.*) days time")]
        [Given(@"I have another hearing in (.*) days time")]
        public void GivenIHaveAHearingAndAConferenceInDaysTime(int days)
        {
            var minutesFromDays = Convert.ToInt32(TimeSpan.FromDays(days).TotalMinutes);
            var userTypes = CreateUserTypes();
            AllocateUsers(userTypes);
            GivenIHaveAHearing(minutesFromDays);
            CreateConference();
        }

        [Given(@"I have a hearing located in (.*)")]
        [Given(@"I have another hearing located in (.*)")]
        public void GivenIHaveAHearingInLocation(string venue)
        {
            var userTypes = CreateUserTypes();
            AllocateUsers(userTypes);
            GivenIHaveAHearing(0, venue);
            CreateConference();
        }

        [Given(@"I have a hearing with audio recording enabled")]
        public void GivenIHaveAHearingWihAudioRecording()
        {
            var userTypes = CreateUserTypes();
            AllocateUsers(userTypes);
            GivenIHaveAHearing(0, DEFAULT_VENUE, true);
            CreateConference();
        }

        [Given(@"I have a hearing with an Observer and Panel Member")]
        public void GivenIHaveAHearingWithAnObserverAndPanelMember()
        {
            var userTypes = CreateUserTypes(2, 1, 1);
            AllocateUsers(userTypes);
            GivenIHaveAHearing();
            CreateConference();
        }

        [Given(@"I have a hearing with an Observer and Panel Member in (.*) minutes time")]
        public void GivenIHaveAHearingWithAnObserverAndPanelMemberIn(int minutes)
        {
            var userTypes = CreateUserTypes(2, 1, 1);
            AllocateUsers(userTypes);
            GivenIHaveAHearing(minutes);
            CreateConference();
            _c.Test.DelayedStartTime = minutes;
        }

        public void GivenIHaveAHearing(int minutes = 0, string venue = DEFAULT_VENUE, bool audioRecordingRequired = false)
        {
            var request = new HearingRequestBuilder()
                .WithUsers(_c.Test.Users)
                .WithScheduledTime(_c.TimeZone.AdjustAnyOS(DateTime.Now.ToUniversalTime().AddMinutes(minutes)))
                .WithVenue(venue)
                .WithAudioRecordingRequired(audioRecordingRequired)
                .Build();

            SendTheHearingRequest(request);
        }

        private void SendTheHearingRequest(CreateHearingRequest request)
        {
            var hearingResponse = _c.Apis.TestApi.CreateHearing(request);
            hearingResponse.StatusCode.Should().Be(HttpStatusCode.Created,
                $"Hearing not created with error '{hearingResponse.Content}'");
            var hearing = RequestHelper.Deserialise<HearingDetailsResponse>(hearingResponse.Content);
            hearing.Should().NotBeNull();
            _c.Test.Hearing = hearing;
            _c.Test.NewHearingId = hearing.Id;
            _c.Test.Case = hearing.Cases.First();
            _c.Test.HearingParticipants = hearing.Participants;
            NUnit.Framework.TestContext.WriteLine($"Hearing created with Hearing Id {hearing.Id}");
        }

        private void CheckThatTheHearingWillBeCreatedForToday(DateTime dateTime)
        {
            if (!_c.TimeZone.AdjustAnyOS(DateTime.Now).Day.Equals(dateTime.Day))
                Assert.Ignore(
                    $"Ignoring the test as the hearing will be created for tomorrow, and won't be visible in the UI.");
        }

        [Given(@"Get the new conference details")]
        [When(@"I attempt to retrieve the new conference details from the video api")]
        public void CreateConference()
        {
            var vho = _c.Test.Users.First(x => x.User_type == UserType.VideoHearingsOfficer);

            var request = new UpdateBookingStatusRequest()
            {
                Updated_by = vho.Username,
                AdditionalProperties = null,
                Cancel_reason = null,
                Status = UpdateBookingStatus.Created
            };

            var response = _c.Apis.TestApi.ConfirmHearingToCreateConference(_c.Test.NewHearingId, request);
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var conference = RequestHelper.Deserialise<ConferenceDetailsResponse>(response.Content);
            _c.Test.Conference = conference;
            _c.Test.Conferences.Add(conference);
            _c.Test.NewConferenceId = conference.Id;
            _c.Test.ConferenceParticipants = conference.Participants;
            NUnit.Framework.TestContext.WriteLine($"Conference created with Conference Id {conference.Id}");
        }

        private static List<UserType> CreateUserTypes(int individualsAndRepresentatives = DEFAULT_INDIVIDUALS_WITH_REPRESENTATIVES
            , int observers = DEFAULT_OBSERVERS, int panelMembers = DEFAULT_PANEL_MEMBERS)
        {
            var userTypes = new List<UserType> { UserType.Judge, UserType.VideoHearingsOfficer };

            for (var i = 0; i < individualsAndRepresentatives; i++)
            {
                userTypes.Add(UserType.Individual);
                userTypes.Add(UserType.Representative);
            }

            for (var i = 0; i < observers; i++)
            {
                userTypes.Add(UserType.Observer);
            }

            for (var i = 0; i < panelMembers; i++)
            {
                userTypes.Add(UserType.PanelMember);
            }

            return userTypes;
        }

        private void AllocateUsers(List<UserType> userTypes)
        {
            var expiresIn = _scenario.ScenarioInfo.Tags.Any(x => x.Contains("HearingTest"))
                ? ALLOCATE_USERS_FOR_HEARING_TESTS
                : ALLOCATE_USERS_FOR_MINUTES;

            var request = new AllocateUsersRequest()
            {
                Application = Application.VideoWeb,
                Expiry_in_minutes = expiresIn,
                Is_prod_user = _c.VideoWebConfig.IsLive,
                Test_type = TestType.Automated,
                User_types = userTypes
            };

            var response = _c.Apis.TestApi.AllocateUsers(request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Should().NotBeNull();
            var users = RequestHelper.Deserialise<List<UserDetailsResponse>>(response.Content);
            users.Should().NotBeNullOrEmpty();
            _c.Test.Users = UserDetailsResponseToUsersMapper.Map(users);
            _c.Test.Users.Should().NotBeNullOrEmpty();
        }
    }
}
