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
using Testing.Common.Helpers;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class RequestConsultationTests
    {
        private ConsultationsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> _eventHubContextMock;
        private IMemoryCache _memoryCache;
        private Conference _testConference;
        private Mock<IEventHubClient> _eventHubClientMock;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _eventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            _memoryCache = new MemoryCache(new MemoryCacheOptions());
            _eventHubClientMock = new Mock<IEventHubClient>();

            _testConference = ConsultationHelper.BuildConferenceForTest();
            _memoryCache.Set(_testConference.Id, _testConference);

            foreach (var participant in _testConference.Participants)
            {
                _eventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                    .Returns(_eventHubClientMock.Object);
            }
            _eventHubContextMock.Setup(x => x.Clients.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(_eventHubClientMock.Object);

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
        public async Task should_return_conference_not_found_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            _memoryCache.Remove(_testConference.Id);
            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            var result = await _controller.HandleConsultationRequest(consultationRequest);

            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_participant_not_found_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = new Conference { Id = Guid.NewGuid() };
            _memoryCache.Set(conference.Id, conference);

            var consultationRequest = Builder<ConsultationRequest>.CreateNew().With(x => x.Conference_id = conference.Id).Build();
            var result = await _controller.HandleConsultationRequest(consultationRequest);

            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_no_content_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.HandleConsultationRequest(ConsultationHelper.GetConsultationRequest(_testConference));
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.HandleConsultationRequest(ConsultationHelper.GetConsultationRequest(_testConference));
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default(ProblemDetails), null);
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.HandleConsultationRequest(ConsultationHelper.GetConsultationRequest(_testConference));
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_send_message_to_other_party_when_requested()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>())).Returns(Task.FromResult(HttpStatusCode.NoContent));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            var result = await _controller.HandleConsultationRequest(consultationRequest);
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();

            _eventHubClientMock.Verify(x => x.ConsultationMessage(_testConference.Id, _testConference.Participants[1].Username, 
                _testConference.Participants[2].Username, string.Empty));
        }

        [TestCase(ConsultationAnswer.Cancelled)]
        [TestCase(ConsultationAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Rejected)]
        public async Task should_send_message_to_other_party_when_answered(ConsultationAnswer answer)
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>())).Returns(Task.FromResult(HttpStatusCode.NoContent));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            consultationRequest.Answer = answer;
            var result = await _controller.HandleConsultationRequest(consultationRequest);
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();

            _eventHubClientMock.Verify(x => x.ConsultationMessage(_testConference.Id, _testConference.Participants[1].Username, 
                _testConference.Participants[2].Username, answer.ToString()));
        }
    }
}