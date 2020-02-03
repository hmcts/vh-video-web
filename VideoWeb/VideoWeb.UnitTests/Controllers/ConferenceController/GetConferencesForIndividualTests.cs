using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferencesForIndividualTests
    {
        private ConferencesController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IUserApiClient> _userApiClientMock;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<ILogger<ConferencesController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _userApiClientMock = new Mock<IUserApiClient>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _mockLogger = new Mock<ILogger<ConferencesController>>();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            
            _controller = new ConferencesController(_videoApiClientMock.Object, _userApiClientMock.Object,
                _bookingsApiClientMock.Object, _mockLogger.Object, new MemoryCache(new MemoryCacheOptions()))
            {
                ControllerContext = context
            };
        }
        
        [Test]
        public async Task Should_return_ok_with_list_of_conferences()
        {
            var conferences = Builder<ConferenceSummaryResponse>.CreateListOfSize(10).All()
                .With(x => x.Scheduled_date_time = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.Scheduled_duration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.Closed_date_time = null)
                .Build().ToList();
            var minutes = -60;
            foreach (var conference in conferences)
            {
                conference.Status = minutes < 0 ? ConferenceState.Closed: ConferenceState.NotStarted;
                conference.Closed_date_time = DateTime.UtcNow.AddMinutes(minutes);
                minutes += 90;
            }

            _videoApiClientMock
                .Setup(x => x.GetConferencesForUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync(conferences);

            var result = await _controller.GetConferencesForIndividual();
            
            var typedResult = (OkObjectResult) result.Result;
            typedResult.Should().NotBeNull();
            
            var conferencesForUser = (List<ConferenceForUserResponse>)typedResult.Value;
            conferencesForUser.Should().NotBeNullOrEmpty();
            conferencesForUser.Count().Should().Be(9);
            var i = 2;
            foreach (var conference in conferencesForUser)
            {
                conference.CaseName.Should().Be($"Case_name{i++}");
            }
        }
        
        [Test]
        public async Task Should_return_ok_with_no_conferences()
        {
            var conferences = new List<ConferenceSummaryResponse>();
            _videoApiClientMock
                .Setup(x => x.GetConferencesForUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync(conferences);

            var result = await _controller.GetConferencesForIndividual();
            
            var typedResult = (OkObjectResult) result.Result;
            typedResult.Should().NotBeNull();
            
            var conferencesForUser = (List<ConferenceForUserResponse>)typedResult.Value;
            conferencesForUser.Should().BeEmpty();
        }
        
        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid email", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferencesForUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForIndividual();
            
            var typedResult = (ObjectResult) result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        } 
        
        [Test]
        public async Task Should_return_forbidden_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Unauthorised Token", (int) HttpStatusCode.Unauthorized,
                "Invalid Client ID", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferencesForUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForIndividual();
            
            var typedResult = (ObjectResult) result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
        } 
        
        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferencesForUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForIndividual();
            var typedResult = result.Value;
            typedResult.Should().BeNull();
        } 
    }
}