using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetParticipantsByConferenceIdTest
    {

        private ParticipantsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IEventHandlerFactory> _eventHandlerFactoryMock;
        private Mock<IConferenceCache> _conferenceCacheMock;
        private Mock<ILogger<ParticipantsController>> _mockLogger;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;

        [SetUp]
        public void Setup()
        {
            _conferenceCacheMock = new Mock<IConferenceCache>();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _eventHandlerFactoryMock = new Mock<IEventHandlerFactory>();
            _mockLogger = new Mock<ILogger<ParticipantsController>>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();

            _controller = new ParticipantsController(_videoApiClientMock.Object, _eventHandlerFactoryMock.Object,
                _conferenceCacheMock.Object, _mockLogger.Object, _bookingsApiClientMock.Object);
        }

        [Test]
        public async Task Should_return_ok()
        {
            var conferenceId = Guid.NewGuid();
            var response = CreateValidParticipantsSummaryResponse();

            _videoApiClientMock
                .Setup(x => x.GetParticipantsByConferenceIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(response);

            var result = await _controller.GetParticipantsByConferenceIdAsync(conferenceId);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var participants = (List<ParticipantForUserResponse>)typedResult.Value;
            participants.Should().NotBeNull();
            participants.Count.Should().Be(3);
        }

        [Test]
        public async Task Should_throw_exception()
        {
            var conferenceId = Guid.NewGuid();
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                 "Please provide a valid conference Id", null, default, null);

            _videoApiClientMock
                .Setup(x => x.GetParticipantsByConferenceIdAsync(It.IsAny<Guid>()))
                .Throws(apiException);

            var result = await _controller.GetParticipantsByConferenceIdAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);

        }

        private List<ParticipantSummaryResponse> CreateValidParticipantsSummaryResponse()
        {
            return Builder<ParticipantSummaryResponse>.CreateListOfSize(3).Build().ToList();
        }
    }
}
