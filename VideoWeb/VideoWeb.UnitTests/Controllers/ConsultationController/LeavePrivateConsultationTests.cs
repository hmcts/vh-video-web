using System;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class LeavePrivateConsultationTests
    {
        private ConsultationsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> _eventHubContextMock;
        private Mock<IConferenceCache> _conferenceCacheMock;
        private Conference _testConference;
        private Mock<ILogger<ConsultationsController>> _loggerMock;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _eventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            _conferenceCacheMock = new Mock<IConferenceCache>();
            _testConference = ConsultationHelper.BuildConferenceForTest();
            _loggerMock = new Mock<ILogger<ConsultationsController>>();

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _conferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            _controller = new ConsultationsController(_videoApiClientMock.Object, _eventHubContextMock.Object,
                _conferenceCacheMock.Object, _loggerMock.Object)
            {
                ControllerContext = context
            };
        }

        [Test]
        public async Task Should_return_participant_not_found_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = new Conference {Id = Guid.NewGuid()};

            _conferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var leaveConsultationRequest = Builder<LeavePrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id).Build();
            var result = await _controller.LeavePrivateConsultationAsync(leaveConsultationRequest);

            var typedResult = (NotFoundResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_no_content_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var leaveConsultationRequest = ConsultationHelper.GetLeaveConsultationRequest(_testConference);
            var result = await _controller.LeavePrivateConsultationAsync(leaveConsultationRequest);

            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _videoApiClientMock
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result =
                await _controller.LeavePrivateConsultationAsync(
                    ConsultationHelper.GetLeaveConsultationRequest(_testConference));
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result =
                await _controller.LeavePrivateConsultationAsync(
                    ConsultationHelper.GetLeaveConsultationRequest(_testConference));
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public void Should_throw_InvalidOperationException_two_participants_requested_found()
        {
            _videoApiClientMock
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = _testConference;

            var leaveConsultationRequest = Builder<LeavePrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id).Build();
            var findId = leaveConsultationRequest.ParticipantId;
            conference.Participants[0].Id = findId;
            conference.Participants[1].Id = findId;

            Assert.ThrowsAsync<InvalidOperationException>(() =>
                _controller.LeavePrivateConsultationAsync(leaveConsultationRequest));

        }
    }
}
