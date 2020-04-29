using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.MediaEventController
{
    public class AddSelfTestFailureEventToConferenceTests
    {
        private VideoWeb.Controllers.MediaEventController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IConferenceCache> _conferenceCacheMock;
        private Conference _testConference;
        private Participant _testParticipant;
        
        [SetUp]
        public void Setup()
        {
            _conferenceCacheMock = new Mock<IConferenceCache>();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            
            _testConference = new EventComponentHelper().BuildConferenceForTest();
            _testParticipant = _testConference.Participants.First(x => !x.IsJudge());
            _testParticipant.Username = ClaimsPrincipalBuilder.Username;

            _conferenceCacheMock.Setup(x => x.GetConferenceAsync(_testConference.Id)).ReturnsAsync(_testConference);
            
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller =
                new VideoWeb.Controllers.MediaEventController(_videoApiClientMock.Object, _conferenceCacheMock.Object)
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
            _conferenceCacheMock.SetupSequence(cache => cache.GetConferenceAsync(_testConference.Id))
                .ReturnsAsync((Conference) null)
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
            _videoApiClientMock.Verify(x => x.GetConferenceDetailsByIdAsync(_testConference.Id), Times.Once);
        }
    }
}
