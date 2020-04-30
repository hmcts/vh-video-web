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
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class RequestConsultationTests
    {
        private ConsultationsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>> _eventHubContextMock;
        private Mock<IConferenceCache> _conferenceCacheMock;
        private Conference _testConference;
        private Mock<IEventHubClient> _eventHubClientMock;
        private Mock<ILogger<ConsultationsController>> _loggerMock;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _eventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            _conferenceCacheMock = new Mock<IConferenceCache>();
            _eventHubClientMock = new Mock<IEventHubClient>();
            _loggerMock = new Mock<ILogger<ConsultationsController>>();

            _testConference = ConsultationHelper.BuildConferenceForTest();

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

            _conferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
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
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = new Conference { Id = Guid.NewGuid() };
            _conferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var consultationRequest = Builder<ConsultationRequest>.CreateNew().With(x => x.Conference_id = conference.Id).Build();
            var result = await _controller.HandleConsultationRequestAsync(consultationRequest);

            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_no_content_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.HandleConsultationRequestAsync(ConsultationHelper.GetConsultationRequest(_testConference));
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
            _eventHubClientMock.Verify(
                x => x.AdminConsultationMessage
                (It.IsAny<Guid>(), It.IsAny<EventHub.Enums.RoomType>(), It.IsAny<string>(), It.IsAny<EventHub.Enums.ConsultationAnswer>()), Times.Never);
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.HandleConsultationRequestAsync(ConsultationHelper.GetConsultationRequest(_testConference));
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
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.HandleConsultationRequestAsync(ConsultationHelper.GetConsultationRequest(_testConference));
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_send_message_to_other_party_when_requested()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>())).Returns(Task.FromResult(HttpStatusCode.NoContent));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            var result = await _controller.HandleConsultationRequestAsync(consultationRequest);
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();

            _eventHubClientMock.Verify(x => x.ConsultationMessage(_testConference.Id, _testConference.Participants[1].Username, 
                _testConference.Participants[2].Username, string.Empty));
        }

        [TestCase(ConsultationAnswer.Cancelled)]
        [TestCase(ConsultationAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Rejected)]
        public async Task Should_send_message_to_other_party_when_answered(ConsultationAnswer answer)
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>())).Returns(Task.FromResult(HttpStatusCode.NoContent));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            consultationRequest.Answer = answer;
            var result = await _controller.HandleConsultationRequestAsync(consultationRequest);
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();

            _eventHubClientMock.Verify(x => x.ConsultationMessage(_testConference.Id, _testConference.Participants[1].Username, 
                _testConference.Participants[2].Username, answer.ToString()));
        }

        [Test]
        public void Should_throw_InvalidOperationException_two_participants_with_the_same_requeste_by_found()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
           
            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            var findId = consultationRequest.Requested_by;
            _testConference.Participants[0].Id = findId;
            _testConference.Participants[1].Id = findId;

            Assert.ThrowsAsync<InvalidOperationException>(()=> _controller.HandleConsultationRequestAsync(consultationRequest));
        }

        [Test]
        public void Should_throw_InvalidOperationException_two_participants_with_the_same_requeste_for_found()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            var findId = consultationRequest.Requested_for;
            _testConference.Participants[0].Id = findId;
            _testConference.Participants[1].Id = findId;
            _testConference.Participants[2].Id = consultationRequest.Requested_by;

            Assert.ThrowsAsync<InvalidOperationException>(() => _controller.HandleConsultationRequestAsync(consultationRequest));
        }

        [Test]
        public async Task Should_throw_InvalidOperationException_no_participants_requested_by_found()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            foreach (var item in _testConference.Participants)
            {
                item.Id = Guid.NewGuid();
            }
           

            var result = await _controller.HandleConsultationRequestAsync(consultationRequest);
            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_throw_InvalidOperationException_no_participants_requested_for_found()
        {
            _videoApiClientMock
                .Setup(x => x.HandleConsultationRequestAsync(It.IsAny<ConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            _testConference.Participants[0].Id = Guid.NewGuid();
            _testConference.Participants[1].Id = Guid.NewGuid();
            _testConference.Participants[2].Id = consultationRequest.Requested_by;

            var result = await _controller.HandleConsultationRequestAsync(consultationRequest);
            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }
    }
}
