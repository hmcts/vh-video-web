using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Controllers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using Conference = VideoWeb.Services.Video.ConferenceForIndividualResponse;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferencesForIndividualTests
    {
        private ConferencesController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<ILogger<ConferencesController>> _mockLogger;
        private Mock<IConferenceCache> _mockConferenceCache;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _mockLogger = new Mock<ILogger<ConferencesController>>();
            _mockConferenceCache = new Mock<IConferenceCache>();

            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };


            _controller = new ConferencesController(_videoApiClientMock.Object, _bookingsApiClientMock.Object,
                _mockLogger.Object, _mockConferenceCache.Object)
            {
                ControllerContext = context
            };

            _mockConferenceCache.Setup(x => x.AddConferenceToCache(It.IsAny<ConferenceDetailsResponse>()));
        }

        [Test]
        public async Task Should_return_ok_with_list_of_conferences()
        {
            var conferences = Builder<Conference>.CreateListOfSize(10).All()
                .With(x => x.Scheduled_date_time = DateTime.UtcNow.AddMinutes(-60))
                .Build().ToList();

            _videoApiClientMock
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync(conferences);

            var result = await _controller.GetConferencesForIndividual();

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForIndividualResponse>)typedResult.Value;
            conferencesForUser.Should().NotBeNullOrEmpty();
            conferencesForUser.Count.Should().Be(conferences.Count);
        }

        [Test]
        public async Task Should_return_ok_with_no_conferences()
        {
            var conferences = new List<Conference>();
            _videoApiClientMock
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync(conferences);

            var result = await _controller.GetConferencesForIndividual();

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForIndividualResponse>)typedResult.Value;
            conferencesForUser.Should().BeEmpty();
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid email", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForIndividual();

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_forbidden_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Unauthorised Token", (int)HttpStatusCode.Unauthorized,
                "Invalid Client ID", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForIndividual();

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForIndividual();
            var typedResult = result.Value;
            typedResult.Should().BeNull();
        }
    }
}
