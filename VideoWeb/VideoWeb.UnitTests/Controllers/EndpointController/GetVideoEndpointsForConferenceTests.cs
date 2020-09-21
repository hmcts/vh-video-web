using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.EndpointController
{
    public class GetVideoEndpointsForConferenceTests
    {
        private EndpointsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<EndpointsController>> _loggerMock;
        
        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _loggerMock = new Mock<ILogger<EndpointsController>>();
            
            _controller = new EndpointsController(_videoApiClientMock.Object, _loggerMock.Object);
        }
        
        [Test]
        public async Task Should_return_ok()
        {
            var conferenceId = Guid.NewGuid();
            var response = Builder<EndpointResponse>.CreateListOfSize(4).All().With(x => x.Id = Guid.NewGuid()).Build()
                .ToList();

            _videoApiClientMock
                .Setup(x => x.GetEndpointsForConferenceAsync(It.IsAny<Guid>()))
                .ReturnsAsync(response);

            var result = await _controller.GetVideoEndpointsForConferenceAsync(conferenceId);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var videoEndpointResponses = typedResult.Value.As<List<VideoEndpointResponse>>();
            videoEndpointResponses.Should().NotBeNull();
            videoEndpointResponses.Count.Should().Be(response.Count);
        }

        [Test]
        public async Task Should_throw_exception()
        {
            var conferenceId = Guid.NewGuid();
            var apiException = new VideoApiException<ProblemDetails>("Not Found", (int)HttpStatusCode.NotFound,
                "Please provide a valid conference Id", null, default, null);

            _videoApiClientMock
                .Setup(x => x.GetEndpointsForConferenceAsync(It.IsAny<Guid>()))
                .Throws(apiException);

            var result = await _controller.GetVideoEndpointsForConferenceAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.NotFound);

        }
    }
}
