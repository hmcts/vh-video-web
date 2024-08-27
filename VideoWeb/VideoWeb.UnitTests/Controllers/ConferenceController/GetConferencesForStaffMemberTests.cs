using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.UnitTests.Builders;
using ConferenceForHostVideoApi = VideoApi.Contract.Responses.ConferenceForHostResponse;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;
using ParticipantForHostVideoApi = VideoApi.Contract.Responses.ParticipantForHostResponse;

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
                .Setup(x => x.GetHearingsForTodayByVenueAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<HearingDetailsResponse>{Mock.Of<HearingDetailsResponse>()});
            
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
                .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
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
                .Setup(x => x.GetHearingsForTodayByVenueAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForStaffMemberAsync(new List<string>(), CancellationToken.None);

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        }

        [Test]
        public async Task Should_return_ok_with_list_of_conferences()
        {
            var hearingVenueNamesQuery = new List<string>();
            var participants = new List<ParticipantForHostVideoApi>
            {
                Builder<ParticipantForHostVideoApi>.CreateNew().With(x => x.Role = UserRole.Individual).Build(),
                Builder<ParticipantForHostVideoApi>.CreateNew().With(x => x.Role = UserRole.Representative).Build(),
                Builder<ParticipantForHostVideoApi>.CreateNew().With(x => x.Role = UserRole.Judge).Build()

            };
            var conferences = Builder<ConferenceForHostVideoApi>.CreateListOfSize(10).All()
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.Participants = participants)
                .Build().ToList();

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferences);

            var result = await _controller.GetConferencesForStaffMemberAsync(hearingVenueNamesQuery, CancellationToken.None);

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForHostResponse>)typedResult.Value;
            conferencesForUser.Should().NotBeNullOrEmpty();
            conferencesForUser.Count.Should().Be(conferences.Count);
            var i = 1;
            foreach (var conference in conferencesForUser)
            {
                conference.CaseName.Should().Be($"CaseName{i++}");
            }
        }

        [Test]
        public async Task Should_return_ok_with_no_conferences()
        {
            var hearingVenueNamesQuery = new List<string>();
            var conferences = new List<ConferenceForHostVideoApi>();
            var bookingException = new BookingsApiException("User does not have any hearings", (int)HttpStatusCode.NotFound, "Error", null, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(conferences);
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(bookingException);

            var result = await _controller.GetConferencesForStaffMemberAsync(hearingVenueNamesQuery, CancellationToken.None);

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForHostResponse>)typedResult.Value;
            conferencesForUser.Should().BeEmpty();
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
