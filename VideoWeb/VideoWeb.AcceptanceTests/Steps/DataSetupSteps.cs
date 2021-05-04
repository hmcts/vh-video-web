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
using TestApi.Contract.Enums;
using TestContext = VideoWeb.AcceptanceTests.Helpers.TestContext;
using TestApi.Contract.Responses;
using TestApi.Contract.Requests;
using BookingsApi.Contract.Requests;
using BookingsApi.Contract.Requests.Enums;
using VideoApi.Contract.Responses;
using BookingsApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class DataSetupSteps
    {
        private const int DEFAULT_INDIVIDUALS_WITH_REPRESENTATIVES = 2;
        private const int DEFAULT_PANEL_MEMBERS = 0;
        private const int DEFAULT_OBSERVERS = 0;
        private const int DEFAULT_WINGERS = 0;
        private const int DEFAULT_INDIVIDUALS_WITH_INTERPRETERS = 0;
        private const string DEFAULT_VENUE = "Birmingham Civil and Family Justice Centre";
        private const string DEFAULT_USER = "";
        private const int ALLOCATE_USERS_FOR_MINUTES = 8;
        private const int ALLOCATE_USERS_FOR_HEARING_TESTS = 15;
        private readonly TestContext _c;
        private readonly ScenarioContext _scenario;
        private bool audioRecordingRequired = false;
        private string hearingVenue = "Birmingham Civil and Family Justice Centre";
        private int delayMinutes = 0; 

        public DataSetupSteps(TestContext c, ScenarioContext scenario)
        {
            _c = c;
            _scenario = scenario;
        }

        [Given(@"I have a hearing")]
        public void GivenIHaveAHearingAndAConference()
        {
            GivenIHaveAHearingWithUser();
        }
         
        [Given(@"I have a hearing with a (.*)")]
        [Given(@"I have a hearing with an (.*)")]
        [Given(@"I have another hearing with another (.*)")]
        [Given(@"I have a CACD hearing with a (.*)")]
        public void GivenIHaveAHearingWithUser(string user = DEFAULT_USER)
        {
            var userTypes = GetUserType(user);
            AllocateUsers(userTypes);
            if(user.ToLower() == "winger")
            {
                CreateCACDHearing(delayMinutes);
            }
            else
            {
                GivenIHaveAHearing(delayMinutes,hearingVenue,audioRecordingRequired);
            }
            CreateConference();

            if(delayMinutes > 0)
                _c.Test.DelayedStartTime = delayMinutes;
        }

        private static List<UserType> GetUserType(string user)
        {
            switch(user.ToLower())
            {
                case "interpreter":
                    return CreateUserTypes(0, 1, 0, 0, individualsAndInterpreters: 1);
                case "observer":
                case "panel member":
                case "observer and panel member":
                    return CreateUserTypes(2, 1, 1);
                case "winger":
                    return CreateUserTypes(2, 0, 0, 1);
                default:
                    return CreateUserTypes();
            }
        }

        [Given(@"I have another hearing")]
        public void GivenIHaveAnotherHearingAndAConference()
        {
            GivenIHaveAHearing(delayMinutes, audioRecordingRequired: true);
            CreateConference();

            if (delayMinutes > 0)
                _c.Test.DelayedStartTime = delayMinutes;
        }

        [Given(@"I have a hearing in (.*) minutes time")]
        public void GivenIHaveAHearingAndAConferenceInMinutesTime(int minutes, bool interpreter = false)
        {
            CheckThatTheHearingWillBeCreatedForToday(_c.TimeZone.Adjust(DateTime.Now.ToUniversalTime().AddMinutes(minutes)));
            var userTypes = interpreter ? CreateUserTypes(1,0,0,0,1) : CreateUserTypes();
            AllocateUsers(userTypes);
            delayMinutes = minutes;
            GivenIHaveAnotherHearingAndAConference();
        }
        
        [Given(@"I have another hearing in (.*) minutes time")]
        public void GivenIHaveAnotherHearingAndAConferenceInMinutesTime(int minutes)
        {            
            CheckThatTheHearingWillBeCreatedForToday(_c.TimeZone.Adjust(DateTime.Now.ToUniversalTime().AddMinutes(minutes)));
            delayMinutes = minutes;
            GivenIHaveAnotherHearingAndAConference();
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
            hearingVenue = venue;
            GivenIHaveAHearingWithUser();
        }

        [Given(@"I have a hearing with audio recording enabled")]
        public void GivenIHaveAHearingWihAudioRecording()
        {
            audioRecordingRequired = true;
            GivenIHaveAHearingWithUser();
        }

        private void CreateCACDHearing(int minutes = 0)
        {
            var request = new HearingRequestBuilder()
                          .WithUsers(_c.Test.Users)
                          .WithCACDCaseType()
                          .WithScheduledTime(_c.TimeZone.Adjust(DateTime.Now.ToUniversalTime().AddMinutes(minutes)))
                          .Build();           
            SendTheHearingRequest(request);
        }

        [Given(@"I have a hearing in (.*) minutes time with (.*)")]
        public void GivenIHaveAHearingInMinutesTimeWithUser(int minutes, string user)
        {
            delayMinutes = minutes;
            GivenIHaveAHearingWithUser(user);
        }

        private void GivenIHaveAHearing(int minutes = 0, string venue = DEFAULT_VENUE, bool audioRecordingRequired = false)
        {
            var request = new HearingRequestBuilder()
                .WithUsers(_c.Test.Users)
                .WithScheduledTime(_c.TimeZone.Adjust(DateTime.Now.ToUniversalTime().AddMinutes(minutes)))
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
            if (!_c.TimeZone.Adjust(DateTime.Now).Day.Equals(dateTime.Day))
                Assert.Ignore(
                    $"Ignoring the test as the hearing will be created for tomorrow, and won't be visible in the UI.");
        }

        [Given(@"Get the new conference details")]
        [When(@"I attempt to retrieve the new conference details from the video api")]
        public void CreateConference()
        {
            var vho = _c.Test.Users.First(x => x.UserType == UserType.VideoHearingsOfficer);

            var request = new UpdateBookingStatusRequest()
            {
                UpdatedBy = vho.Username,
                CancelReason = null,
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

        private static List<UserType> CreateUserTypes(
            int individualsAndRepresentatives = DEFAULT_INDIVIDUALS_WITH_REPRESENTATIVES, 
            int observers = DEFAULT_OBSERVERS, 
            int panelMembers = DEFAULT_PANEL_MEMBERS,
            int wingers = DEFAULT_WINGERS,
            int individualsAndInterpreters = DEFAULT_INDIVIDUALS_WITH_INTERPRETERS)
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

            for (var i = 0; i < wingers; i++)
            {
                userTypes.Add(UserType.Winger);
            }
            
            for (var i = 0; i < individualsAndInterpreters; i++)
            {
                userTypes.Add(UserType.Individual);
                userTypes.Add(UserType.Interpreter);
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
                ExpiryInMinutes = expiresIn,
                IsEjud = _c.VideoWebConfig.UsingEjud,
                IsProdUser = _c.VideoWebConfig.IsLive,
                TestType = TestType.Automated,
                UserTypes = userTypes
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
