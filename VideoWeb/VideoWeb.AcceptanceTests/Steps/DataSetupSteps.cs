using System;
using System.Collections.Generic;
using System.Data;
using System.Net;
using System.Runtime.Serialization;
using System.Threading;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Assertions;
using Testing.Common.Builders;
using Testing.Common.Configuration;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Configuration;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using ParticipantRequest = VideoWeb.Services.Bookings.ParticipantRequest;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class DataSetupSteps
    {
        private readonly TestContext _context;
        private readonly HearingsEndpoints _bookingEndpoints = new BookingsApiUriFactory().HearingsEndpoints;
        private readonly ConferenceEndpoints _videoEndpoints = new VideoApiUriFactory().ConferenceEndpoints;
        private const int NumberOfIndividuals = 2;
        private const int NumberOfRepresentatives = 2;
        private const int HearingDuration = 60;

        public DataSetupSteps(TestContext context)
        {
            _context = context;
        }

        [Given(@"I have a hearing and a conference")]
        [Given(@"I have another hearing and a conference")]
        public void GivenIHaveAHearingAndAConference()
        {
            GivenIHaveAHearing();
            GetTheNewConferenceDetails();
        }

        [Given(@"I have a hearing and a conference in (.*) minutes time")]
        public void GivenIHaveAHearingAndAConferenceInMinutesTime(int minutes)
        {
            GivenIHaveAHearing(minutes);
            GetTheNewConferenceDetails();
            _context.DelayedStartTime = minutes;
        }

        [Given(@"I have a hearing and a conference in (.*) days time")]
        [Given(@"I have another hearing and a conference in (.*) days time")]
        public void GivenIHaveAHearingAndAConferenceInDaysTime(int days)
        {
            var minutesFromDays = Convert.ToInt32(TimeSpan.FromDays(days).TotalMinutes);
            GivenIHaveAHearing(minutesFromDays);
            GetTheNewConferenceDetails();
        }

        [Given(@"I have a hearing")]
        public void GivenIHaveAHearing(int minutes = 0)
        {
            var hearingRequest = new CreateHearingRequest();
            _context.RequestBody = hearingRequest.BuildRequest();

            var participants = new List<ParticipantRequest>();

            var judge = _context.GetJudgeUser();
            var individualUsers = _context.GetIndividualUsers();
            var representativeUsers = _context.GetRepresentativeUsers();

            AddIndividualParticipants(individualUsers, participants);
            AddRepresentativeParticipants(representativeUsers, participants);
            AddJudgeParticipant(judge, participants);

            _context.RequestBody.Participants = participants;
            _context.RequestBody.Scheduled_date_time = DateTime.Now.ToUniversalTime().AddMinutes(minutes);
            _context.RequestBody.Scheduled_duration = HearingDuration;
            _context.Request = _context.Post(_bookingEndpoints.BookNewHearing(), _context.RequestBody);

            WhenISendTheRequestToTheBookingsApiEndpoint();
            ThenTheHearingOrConferenceShouldBe(HttpStatusCode.Created);
            ThenTheHearingDetailsShouldBeRetrieved();
        }

        [Given(@"Get the new conference details")]
        public void GetTheNewConferenceDetails()
        {
            IConferenceRetriever conferenceRetriever;
            if (_context.RunningLocally)
            {
                conferenceRetriever = new RetrieveConferenceLocally();
            }
            else
            {
                conferenceRetriever = new RetrieveConferenceFromBus();
            }
            var conference = conferenceRetriever.GetConference(_context);
            AssertConferenceDetailsResponse.ForConference(conference);

            if (conference.Id != null)
            {
                _context.Conference = conference;
                _context.NewConferenceId = (Guid)conference.Id;
            }
            else
            {
                throw new DataException("Conference Id has not been set");
            }
        }

        [When(@"I send the requests to the bookings api")]
        public void WhenISendTheRequestToTheBookingsApiEndpoint()
        {
            _context.Response = _context.BookingsApiClient().Execute(_context.Request);
            if (_context.Response.Content != null)
                _context.Json = _context.Response.Content;
        }

        [Then(@"the hearings should be (.*)")]
        [Then(@"the conference should be (.*)")]
        public void ThenTheHearingOrConferenceShouldBe(HttpStatusCode status)
        {
            _context.Response.StatusCode.Should().Be(status);
            _context.Response.IsSuccessful.Should().Be(true);           
        }

        [Then(@"hearing details should be retrieved")]
        public void ThenTheHearingDetailsShouldBeRetrieved()
        {
            var hearing = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(_context.Json);
            hearing.Should().NotBeNull();
            AssertHearingResponse.ForHearing(hearing);
            _context.Hearing = hearing;
            if (hearing.Id != null)
            {
                _context.NewHearingId = (Guid)hearing.Id;
            }
            else
            {
                throw new InvalidDataContractException("Hearing Id must be set");
            }
        }

        private static void AddJudgeParticipant(UserAccount judge, ICollection<ParticipantRequest> participants)
        {
            participants.Add(new ParticipantRequest()
            {
                Case_role_name = "Judge",
                Contact_email = judge.AlternativeEmail,
                Display_name = judge.Displayname,
                First_name = judge.Firstname,
                Hearing_role_name = "Judge",
                Last_name = judge.Lastname,
                Middle_names = "",
                Representee = "",
                Organisation_name = "MoJ",
                Solicitors_reference = "",
                Title = "Mrs",
                Username = judge.Username
            });
        }

        private static void AddRepresentativeParticipants(IReadOnlyList<UserAccount> representativeUsers, ICollection<ParticipantRequest> participants)
        {
            for (var j = 0; j < NumberOfRepresentatives; j++)
            {
                var participant = new ParticipantRequest
                {
                    Case_role_name = representativeUsers[j].CaseRoleName,
                    Contact_email = representativeUsers[j].AlternativeEmail,
                    Display_name = representativeUsers[j].Displayname,
                    First_name = representativeUsers[j].Firstname,
                    Hearing_role_name = representativeUsers[j].HearingRoleName,
                    Last_name = representativeUsers[j].Lastname,
                    Middle_names = "",
                    Representee = representativeUsers[j].Representee,
                    Organisation_name = "MoJ",
                    Solicitors_reference = "",
                    Title = "Mrs",
                    Username = representativeUsers[j].Username
                };
                participants.Add(participant);
            }
        }

        private static void AddIndividualParticipants(IReadOnlyList<UserAccount> individualUsers, ICollection<ParticipantRequest> participants)
        {
            for (var i = 0; i < NumberOfIndividuals; i++)
            {
                var participant = new ParticipantRequest
                {
                    Case_role_name = individualUsers[i].CaseRoleName,
                    Contact_email = individualUsers[i].AlternativeEmail,
                    Display_name = individualUsers[i].Displayname,
                    First_name = individualUsers[i].Firstname,
                    Hearing_role_name = individualUsers[i].HearingRoleName,
                    Last_name = individualUsers[i].Lastname,
                    Middle_names = "",
                    Representee = "",
                    Organisation_name = "MoJ",
                    Solicitors_reference = individualUsers[i].SolicitorsReference,
                    Telephone_number = "01234567890",
                    Title = "Mrs",
                    Username = individualUsers[i].Username,
                    House_number = "102",
                    Street = "Petty France",
                    Postcode = "SW1H 9AJ",
                    City = "London",
                    County = "London"
                };
                participants.Add(participant);
            }
        }
    }
}
