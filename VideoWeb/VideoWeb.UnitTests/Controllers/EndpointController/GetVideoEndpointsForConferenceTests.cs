using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoWeb.Common;
using VideoWeb.Common.Models;

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
            var endpoints = Builder<Endpoint>.CreateListOfSize(3).All().With(x => x.Id = Guid.NewGuid()).Build()
                .ToList();
            var response = Builder<Conference>.CreateNew()
                .With(x => x.Endpoints = endpoints)
                .With(x => x.Id = Guid.NewGuid()).Build();
            _mocker.Mock<IConferenceService>()
                .Setup(x => x.GetConference(conferenceId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(response);

            var result = await _controller.GetVideoEndpointsForConferenceAsync(conferenceId, CancellationToken.None);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var videoEndpointResponses = typedResult.Value.As<List<VideoEndpointResponse>>();
            videoEndpointResponses.Should().NotBeNull();
            videoEndpointResponses.Count.Should().Be(endpoints.Count);
        }

        [Test]
        public async Task Should_throw_exception()
        {
            var conferenceId = Guid.NewGuid();
            var apiException = new VideoApiException<ProblemDetails>("Not Found", (int)HttpStatusCode.NotFound,
                "Please provide a valid conference Id", null, default, null);
            
            _mocker.Mock<IConferenceService>()
                .Setup(x => x.GetConference(conferenceId, It.IsAny<CancellationToken>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetVideoEndpointsForConferenceAsync(conferenceId, CancellationToken.None);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.NotFound);

        }
    }
}
