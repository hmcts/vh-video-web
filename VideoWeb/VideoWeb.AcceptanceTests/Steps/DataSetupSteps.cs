﻿using System;
using System.Data;
using System.Net;
using System.Runtime.Serialization;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Assertions;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Configuration.ConferenceRetrievers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Bookings;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class DataSetupSteps
    {
        private readonly TestContext _context;
        private readonly HearingsEndpoints _bookingEndpoints = new BookingsApiUriFactory().HearingsEndpoints;
        private const int HearingDuration = 60;

        public DataSetupSteps(TestContext context)
        {
            _context = context;
        }

        [Given(@"I have a hearing")]
        public void GivenIHaveAHearingOnly()
        {
            GivenIHaveAHearing();
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

        public void GivenIHaveAHearing(int minutes = 0)
        {
            var hearingRequest = new HearingRequestBuilder()
                .WithScheduledTime(DateTime.Now.ToUniversalTime().AddMinutes(minutes))
                .WithScheduledDuration(HearingDuration)
                .WithContext(_context);

            _context.RequestBody = hearingRequest.Build();
            _context.Request = _context.Post(_bookingEndpoints.BookNewHearing(), _context.RequestBody);

            new ExecuteRequestBuilder()
                .WithContext(_context)
                .WithExpectedStatusCode(HttpStatusCode.Created)
                .SendToBookingsApi();

            ThenTheHearingDetailsShouldBeRetrieved();
        }

        [Given(@"Get the new conference details")]
        [When(@"I attempt to retrieve the new conference details from the video api")]
        public void GetTheNewConferenceDetails()
        {
            IConferenceRetriever conferenceRetriever;
            if (_context.RunningVideoApiLocally)
            {
                conferenceRetriever = new RetrieveConferenceLocally();
            }
            else
            {
                conferenceRetriever = new RetrieveConferenceFromBus();
            }
            var conference = conferenceRetriever.GetConference(_context);
            AssertConferenceDetailsResponse.ForConference(conference);

            if (conference.Id != Guid.Empty)
            {
                _context.Conference = conference;
                _context.NewConferenceId = conference.Id;
            }
            else
            {
                throw new DataException("Conference Id has not been set");
            }
        }

        [Then(@"hearing details should be retrieved")]
        public void ThenTheHearingDetailsShouldBeRetrieved()
        {
            var hearing = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<HearingDetailsResponse>(_context.Json);
            hearing.Should().NotBeNull();
            AssertHearingResponse.ForHearing(hearing);
            _context.Hearing = hearing;
            _context.Cases = hearing.Cases;
            if (hearing.Id != Guid.Empty)
            {
                _context.NewHearingId = hearing.Id;
            }
            else
            {
                throw new InvalidDataContractException("Hearing Id must be set");
            }
        }
    }
}
