using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Client;
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
using VideoWeb.Controllers;
using VideoWeb.UnitTests.Builders;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferencesForStaffMemberTests
    {
        private AutoMock _mocker;
        private ConferencesController _controller;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueV2Async(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<HearingDetailsResponseV2>{Mock.Of<HearingDetailsResponseV2>()});
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.StaffMember).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
        }

        [Test]
        public async Task Should_forward_error_when_video_api_returns_error()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForStaffMemberAsync(new List<string>(), CancellationToken.None);

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        }
        
        [Test]
        public async Task Should_forward_error_when_bookings_api_returns_error()
        {
            var apiException = new BookingsApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueV2Async(It.IsAny<List<string>>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForStaffMemberAsync(new List<string>(), CancellationToken.None);

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        }

        [Test]
        public async Task Should_return_ok_with_list_of_conferences()
        {
            var hearingVenueNamesQuery = new List<string>();
            var participants = new List<ParticipantCoreResponse>
            {
                Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.Individual).Build(),
                Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.Representative).Build(),
                Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.Judge).Build()
            };
            var conferences = Builder<ConferenceCoreResponse>.CreateListOfSize(10).All()
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.CurrentStatus = ConferenceState.NotStarted)
                .With(x => x.Participants = participants)
                .Build().ToList();
            
            var hearings = Builder<HearingDetailsResponseV2>.CreateListOfSize(10)
                .All()
                .With(x => x.Cases = Builder<CaseResponseV2>.CreateListOfSize(1).Build().ToList())
                .Build().ToList();
            
            for (var i = 0; i < hearings.Count; i++)
            {
                conferences[i].HearingId = hearings[i].Id;
            }
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferences);
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueV2Async(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(hearings);

            var result = await _controller.GetConferencesForStaffMemberAsync(hearingVenueNamesQuery, CancellationToken.None);

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForHost = (List<ConferenceForHostResponse>)typedResult.Value;
            conferencesForHost.Should().NotBeNullOrEmpty();
            conferencesForHost!.Count.Should().Be(conferences.Count);
            conferencesForHost[0].Participants.Should().NotBeNullOrEmpty();
            conferencesForHost[0].Participants.Count.Should().Be(participants.Count);
        }

        [Test]
        public async Task Should_return_ok_with_no_conferences()
        {
            var hearingVenueNamesQuery = new List<string>();
            var conferences = new List<ConferenceCoreResponse>();
            var bookingException = new BookingsApiException("User does not have any hearings", (int)HttpStatusCode.NotFound, "Error", null, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferences);
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueV2Async(It.IsAny<List<string>>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(bookingException);

            var result = await _controller.GetConferencesForStaffMemberAsync(hearingVenueNamesQuery, CancellationToken.None);

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForHost = (List<ConferenceForHostResponse>)typedResult.Value;
            conferencesForHost.Should().BeEmpty();
        }

        private ConferencesController SetupControllerWithClaims(System.Security.Claims.ClaimsPrincipal claimsPrincipal)
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
