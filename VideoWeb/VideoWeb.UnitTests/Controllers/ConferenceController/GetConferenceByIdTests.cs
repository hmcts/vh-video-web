using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Testing.Common.Helpers;
using VideoWeb.Controllers;
using VideoWeb.Services.Video;
using ProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferenceByIdTests
    {
        private ConferencesController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        
        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            
            _controller = new ConferencesController(_videoApiClientMock.Object)
            {
                ControllerContext = context
            };
        }

        
        [Test]
        public async Task should_return_ok_when_user_belongs_to_conference()
        {
            var conference = CreateValidResponse();
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var result = await _controller.GetConferenceById(conference.Id.GetValueOrDefault());
            var typedResult = (OkObjectResult) result.Result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_unauthorised_when_getting_conference_user_does_not_belong_to()
        {
            var conference = CreateValidResponse(null);
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var result = await _controller.GetConferenceById(conference.Id.GetValueOrDefault());
            var typedResult = (UnauthorizedResult) result.Result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.GetConferencesForUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceById(Guid.Empty);
            
            var typedResult = (BadRequestObjectResult) result.Result;
            typedResult.Should().NotBeNull();
        } 
        
        [Test]
        public async Task should_return_forbidden_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Unauthorised Token", (int) HttpStatusCode.Unauthorized,
                "Invalid Client ID", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceById(Guid.NewGuid());
            
            var typedResult = (ObjectResult) result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
        }
        
        [Test]
        public async Task should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceById(Guid.NewGuid());
            var typedResult = result.Value;
            typedResult.Should().BeNull();
        } 

        private ConferenceDetailsResponse CreateValidResponse(string username = "john@doe.com")
        {
            var participants = Builder<ParticipantDetailsResponse>.CreateListOfSize(2).Build().ToList();
            if (!string.IsNullOrWhiteSpace(username))
            {
                participants.First().Username = username;
            }

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x=> x.Participants = participants)
                .Build();
            return conference;
        }
    }
}