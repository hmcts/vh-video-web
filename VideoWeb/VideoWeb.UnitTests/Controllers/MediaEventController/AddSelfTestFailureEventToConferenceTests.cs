using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.MediaEventController
{
    public class AddSelfTestFailureEventToConferenceTests
    {
        private VideoWeb.Controllers.MediaEventController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IConferenceService> _conferenceServiceMock;
        private Mock<ILogger<VideoWeb.Controllers.MediaEventController>> _logger;
        private Conference _testConference;
        private Participant _testParticipant;
        
        [SetUp]
        public void Setup()
        {
            _conferenceServiceMock = new Mock<IConferenceService>();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _logger = new Mock<ILogger<VideoWeb.Controllers.MediaEventController>>();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            
            _testConference = new EventComponentHelper().BuildConferenceForTest();
            _testParticipant = _testConference.Participants.First(x => !x.IsJudge());
            _testParticipant.Username = ClaimsPrincipalBuilder.Username;
            
            _conferenceServiceMock
                .Setup(x => x.GetConference(_testConference.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(_testConference);
            
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller =
                new VideoWeb.Controllers.MediaEventController(_videoApiClientMock.Object, _logger.Object, _conferenceServiceMock.Object)
                {
                    ControllerContext = context
                };
        }

        [Test]
        public async Task Should_return_no_content_when_event_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));

            var conferenceId = _testConference.Id;
            var request = new AddSelfTestFailureEventRequest
            {
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            var result = await _controller.AddSelfTestFailureEventToConferenceAsync(conferenceId, request);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .ThrowsAsync(apiException);

            var conferenceId = _testConference.Id;
            var request = new AddSelfTestFailureEventRequest
            {
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            var result = await _controller.AddSelfTestFailureEventToConferenceAsync(conferenceId, request);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task Should_call_api_when_cache_is_empty()
        {
            _conferenceServiceMock
                .Setup(x => x.GetConference(_testConference.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(_testConference);
            
            _videoApiClientMock
                .Setup(x => x.RaiseVideoEventAsync(It.IsAny<ConferenceEventRequest>()))
                .Returns(Task.FromResult(default(object)));
            
            var conferenceId = _testConference.Id;
            var request = new AddSelfTestFailureEventRequest
            {
                SelfTestFailureReason = SelfTestFailureReason.BadScore
            };
            await _controller.AddSelfTestFailureEventToConferenceAsync(conferenceId, request);
            _conferenceServiceMock.Verify(x => x.GetConference(_testConference.Id, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
