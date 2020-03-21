using System;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
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
        private IMemoryCache _memoryCache;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _eventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            _memoryCache = new MemoryCache(new MemoryCacheOptions());
            _testConference = ConsultationHelper.BuildConferenceForTest();
            _memoryCache.Set(_testConference.Id, _testConference);

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = new ConsultationsController(_videoApiClientMock.Object, _eventHubContextMock.Object, _memoryCache)
            {
                ControllerContext = context
            };
        }
        
        [Test]
        public async Task Should_return_conference_not_found_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            _memoryCache.Remove(_testConference.Id);
            var leaveConsultationRequest = ConsultationHelper.GetLeaveConsultationRequest(_testConference);
            var result = await _controller.LeavePrivateConsultationAsync(leaveConsultationRequest);

            var typedResult = (NotFoundResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_participant_not_found_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = new Conference {Id = Guid.NewGuid()};
            _memoryCache.Set(conference.Id, conference);

            var leaveConsultationRequest = Builder<LeaveConsultationRequest>.CreateNew().With(x => x.Conference_id = conference.Id).Build();
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

            var result = await _controller.LeavePrivateConsultationAsync(ConsultationHelper.GetLeaveConsultationRequest(_testConference));
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

            var result = await _controller.LeavePrivateConsultationAsync(ConsultationHelper.GetLeaveConsultationRequest(_testConference));
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

            var leaveConsultationRequest = Builder<LeaveConsultationRequest>.CreateNew().With(x => x.Conference_id = conference.Id).Build();
            var findId = leaveConsultationRequest.Participant_id;
            conference.Participants[0].Id = findId;
            conference.Participants[1].Id = findId;


            Assert.ThrowsAsync<InvalidOperationException>(() => _controller.LeavePrivateConsultationAsync(leaveConsultationRequest));

        }

    }
}