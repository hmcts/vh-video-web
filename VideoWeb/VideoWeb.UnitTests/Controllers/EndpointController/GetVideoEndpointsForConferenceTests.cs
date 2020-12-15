using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
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
        private AutoMock _mocker;
        private EndpointsController _controller;
        
        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _controller = _mocker.Create<EndpointsController>();
        }
        
        [Test]
        public async Task Should_return_ok()
        {
            var conferenceId = Guid.NewGuid();
            var response = Builder<EndpointResponse>.CreateListOfSize(4).All().With(x => x.Id = Guid.NewGuid()).Build()
                .ToList();

            _mocker.Mock<IVideoApiClient>()
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

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetEndpointsForConferenceAsync(It.IsAny<Guid>()))
                .Throws(apiException);

            var result = await _controller.GetVideoEndpointsForConferenceAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.NotFound);

        }
    }
}
