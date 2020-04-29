using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Faker;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferencesForVHOfficerTests
    {
        private ConferencesController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<ConferencesController>> _mockLogger;
        private Mock<IConferenceCache> _mockConferenceCache;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _mockLogger = new Mock<ILogger<ConferencesController>>();
            _mockConferenceCache = new Mock<IConferenceCache>();

            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.VideoHearingsOfficer).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);

            _mockConferenceCache.Setup(x => x.AddConferenceAsync(It.IsAny<ConferenceDetailsResponse>()));
        }

        [Test]
        public async Task Should_return_unauthorised_when_not_a_vh_officer()
        {
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.Individual).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery());

            var typedResult = (UnauthorizedObjectResult) result.Result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be a VH Officer");
        }

        [Test]
        public async Task Should_forward_error_when_video_api_returns_error()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferencesTodayForAdminAsync(It.IsAny<IEnumerable<string>>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery());

            var typedResult = (ObjectResult) result.Result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
        }


        [Test]
        public async Task Should_return_ok_with_list_of_conferences()
        {
            var participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Internet.Email())
                .TheFirst(1).With(x => x.User_role = UserRole.Judge)
                .TheRest().With(x => x.User_role = UserRole.Individual).Build().ToList();


            var conferences = Builder<ConferenceForAdminResponse>.CreateListOfSize(10).All()
                .With(x => x.Participants = participants)
                .With(x => x.Scheduled_date_time = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.Scheduled_duration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.Closed_date_time = null)
                .Build().ToList();
            conferences.Last().Status = ConferenceState.InSession;

            var minutes = -60;
            foreach (var conference in conferences)
            {
                conference.Closed_date_time = DateTime.UtcNow.AddMinutes(minutes);
                minutes += 30;
            }

            var closedConferenceTimeLimit = DateTime.UtcNow.AddMinutes(30);
            var expectedConferenceIds = conferences.Where(x =>
                    x.Status != ConferenceState.Closed ||
                    DateTime.Compare(x.Closed_date_time.GetValueOrDefault(), closedConferenceTimeLimit) < 0)
                .Select(x => x.Id).ToList();


            _videoApiClientMock
                .Setup(x => x.GetConferencesTodayForAdminAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(conferences);

            var conferenceWithMessages = conferences.First();
            var judge = conferenceWithMessages.Participants.Single(x => x.User_role == UserRole.Judge);
            var messages = new List<InstantMessageResponse>
            {
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 5", Time_stamp = DateTime.UtcNow.AddMinutes(-1)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 4", Time_stamp = DateTime.UtcNow.AddMinutes(-2)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 3", Time_stamp = DateTime.UtcNow.AddMinutes(-4)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 2", Time_stamp = DateTime.UtcNow.AddMinutes(-6)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 1", Time_stamp = DateTime.UtcNow.AddMinutes(-7)},
            };

            foreach (var conference in conferences)
            {
                _videoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conference.Id))
                    .ReturnsAsync(new List<InstantMessageResponse>());
            }

            _videoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceWithMessages.Id))
                .ReturnsAsync(messages);

            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery());

            var typedResult = (OkObjectResult) result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForVhOfficerResponse>) typedResult.Value;
            conferencesForUser.Should().NotBeNullOrEmpty();
            var returnedIds = conferencesForUser.Select(x => x.Id).ToList();
            returnedIds.Should().Contain(expectedConferenceIds);
            var i = 1;
            foreach (var conference in conferencesForUser)
            {
                conference.CaseName.Should().Be($"Case_name{i++}");
            }

            // paused hearings in sessions cannot chat, no need to get history
            _videoApiClientMock.Verify(x => x.GetInstantMessageHistoryAsync(conferences.Last().Id), Times.Never);
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

            return new ConferencesController(_videoApiClientMock.Object,
                _mockLogger.Object, _mockConferenceCache.Object)
            {
                ControllerContext = context
            };
        }

    }
}
