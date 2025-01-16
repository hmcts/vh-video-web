using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using Bogus;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Requests;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.UnitTests.Builders;
using LinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferencesForVhOfficerTests
    {
        private AutoMock _mocker;
        private ConferencesController _controller;

        private static readonly Faker Faker = new();

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueV2Async(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<HearingDetailsResponseV2>{Mock.Of<HearingDetailsResponseV2>()});

            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
        }

        [Test]
        public async Task should_return_validation_problem_if_query_is_null()
        {
            // arrange / act
            var result = await _controller.GetConferencesForVhOfficerAsync(null, CancellationToken.None);
            
            // assert
            result.Result.Should().BeOfType<ObjectResult>()
                .Which.Value.Should().BeOfType<ValidationProblemDetails>()
                .Subject.Errors.Should().ContainKey("query")
                .WhoseValue.Contains("Please provide a filter for hearing venue names or allocated CSOs").Should()
                .BeTrue();
        }
        
        [Test]
        public async Task should_query_by_venue_name()
        {
            // arrange
            var conferenceAndHearing = CreateHearingsAndConferences(false);
            
            var venueNames = new List<string>{"Venue1"};
            var hearingRefIds = conferenceAndHearing.hearings.Select(x => x.Id).ToList();
            var query = new VhoConferenceFilterQuery {HearingVenueNames = venueNames };
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueV2Async(venueNames, It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferenceAndHearing.hearings);
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByHearingRefIdsAsync(It.Is<GetConferencesByHearingIdsRequest>(r => r.HearingRefIds.SequenceEqual(hearingRefIds)), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferenceAndHearing.conferences);
            
            // act
            var result = await _controller.GetConferencesForVhOfficerAsync(query, CancellationToken.None);
            
            // assert
            result.Result.Should().BeOfType<OkObjectResult>()
                .Which.Value.Should().BeOfType<List<ConferenceForVhOfficerResponse>>()
                .Which.Should().HaveCount(10);
        }
        
        [Test]
        public async Task should_query_by_allocated_cso()
        {
            // arrange
            var conferenceAndHearing = CreateHearingsAndConferences(true);
            var csoIds = conferenceAndHearing.hearings.Where(x=> x.AllocatedToId.HasValue).Select(x=> x.AllocatedToId.Value).Distinct().ToList();
            var hearingRefIds = conferenceAndHearing.hearings.Select(x => x.Id).ToList();
            var query = new VhoConferenceFilterQuery {AllocatedCsoIds = csoIds };
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByCsosV2Async(It.Is<HearingsForTodayByAllocationRequestV2>(r => r.CsoIds.SequenceEqual(csoIds)), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferenceAndHearing.hearings);
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByHearingRefIdsAsync(It.Is<GetConferencesByHearingIdsRequest>(r => r.HearingRefIds.SequenceEqual(hearingRefIds)), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferenceAndHearing.conferences);
            
            // act
            var result = await _controller.GetConferencesForVhOfficerAsync(query, CancellationToken.None);
            
            // assert
            result.Result.Should().BeOfType<OkObjectResult>()
                .Which.Value.Should().BeOfType<List<ConferenceForVhOfficerResponse>>()
                .Which.Should().HaveCount(10);
        }
        
        [Test]
        public async Task should_query_by_unallocated()
        {
            // arrange
            var conferenceAndHearing = CreateHearingsAndConferences(false);
            var hearingRefIds = conferenceAndHearing.hearings.Select(x => x.Id).ToList();
            var query = new VhoConferenceFilterQuery {IncludeUnallocated = true};
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByCsosV2Async(It.Is<HearingsForTodayByAllocationRequestV2>(r => r.Unallocated == true), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferenceAndHearing.hearings);
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByHearingRefIdsAsync(It.Is<GetConferencesByHearingIdsRequest>(r => r.HearingRefIds.SequenceEqual(hearingRefIds)), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferenceAndHearing.conferences);
            
            // act
            var result = await _controller.GetConferencesForVhOfficerAsync(query, CancellationToken.None);
            
            // assert
            result.Result.Should().BeOfType<OkObjectResult>()
                .Which.Value.Should().BeOfType<List<ConferenceForVhOfficerResponse>>()
                .Which.Should().HaveCount(10);
        }

        [Test]
        public async Task should_return_validation_problem_if_no_query_filters_are_met()
        {
            // arrange
            var query = new VhoConferenceFilterQuery();
            
            // act
            var result = await _controller.GetConferencesForVhOfficerAsync(query, CancellationToken.None);
            
            // assert
            result.Result.Should().BeOfType<ObjectResult>()
                .Which.Value.Should().BeOfType<ValidationProblemDetails>()
                .Subject.Errors.Should().ContainKey("query")
                .WhoseValue.Contains("Please provide a filter for hearing venue names or allocated CSOs").Should()
                .BeTrue();
    
        }

        private static (List<ConferenceDetailsResponse> conferences, List<HearingDetailsResponseV2> hearings) CreateHearingsAndConferences(bool includeAllocation)
        {
            var participants = Builder<ParticipantResponse>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Faker.Internet.Email())
                .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                .TheFirst(1).With(x => x.UserRole = UserRole.Judge)
                .TheRest().With(x => x.UserRole = UserRole.Individual).Build().ToList();
            
            var conferences = Builder<ConferenceDetailsResponse>.CreateListOfSize(10).All()
                .With(x => x.Participants = participants)
                .With((x, i) => x.CaseName = $"Test case name {i+1}")
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.CurrentStatus = ConferenceState.NotStarted)
                .With(x => x.ClosedDateTime = null)
                .With(x => x.IsWaitingRoomOpen = true)
                .Random(2).With(x => x.CaseName = "Test case name same").And(x=> x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-10))
                .Random(2).With(x => x.CaseName = "Test case name same closed").With(x => x.CurrentStatus = ConferenceState.Closed).And(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-30)).And(x => x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-200))
                .Random(1).With(x => x.CurrentStatus = ConferenceState.Closed).And(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-25)).And(x => x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-100))
                .Random(1).With(x=> x.CurrentStatus = ConferenceState.InSession).And(x => x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-100))
                .Build().ToList();

            var hearings = new List<HearingDetailsResponseV2>();
            
            var allocationId = Guid.NewGuid();
            foreach (var conference in conferences)
            {
                var hearing = Builder<HearingDetailsResponseV2>.CreateNew()
                    .With(x => x.Id = conference.HearingId)
                    .With(x => x.Cases = Builder<CaseResponseV2>.CreateListOfSize(1).Build().ToList())
                    .Build();
                
                if (includeAllocation)
                {
                    hearing.AllocatedToId = allocationId;
                    hearing.AllocatedToName = "Test allocation";
                    hearing.AllocatedToUsername = "Test allocation";
                    hearing.SupportsWorkAllocation = true;
                }
                
                hearings.Add(hearing);
            }
            
            return (conferences, hearings);
        }

        private ConferencesController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            
            var controller = _mocker.Create<ConferencesController>();
            controller.ControllerContext = context;
            return controller;
        }

    }
}
