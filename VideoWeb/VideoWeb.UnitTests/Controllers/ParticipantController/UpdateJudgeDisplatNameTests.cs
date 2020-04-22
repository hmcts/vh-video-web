using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using EventHubEventType = VideoWeb.EventHub.Enums.EventType;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class UpdateJudgeDisplatNameTests
    {
        private ParticipantsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IEventHandlerFactory> _eventHandlerFactoryMock;
        private Mock<IEventHandler> _eventHandlerMock;
        private readonly EventComponentHelper _eventComponentHelper = new EventComponentHelper();
        private Conference _testConference;
        private Mock<IConferenceCache> _conferenceCacheMock;

        [SetUp]
        public void Setup()
        {
            _conferenceCacheMock = new Mock<IConferenceCache>();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _eventHandlerFactoryMock = new Mock<IEventHandlerFactory>();
            _eventHandlerMock = new Mock<IEventHandler>();

            _eventHandlerFactoryMock.Setup(x => x.Get(It.IsAny<EventHubEventType>())).Returns(_eventHandlerMock.Object);

            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _testConference = _eventComponentHelper.BuildConferenceForTest();
            _testConference.Participants[0].Username = ClaimsPrincipalBuilder.Username;

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = new ParticipantsController(_videoApiClientMock.Object, _eventHandlerFactoryMock.Object, _conferenceCacheMock.Object)
            {
                ControllerContext = context
            };
        }

        [Test]
        public async Task should_return_ok()
        {
            _conferenceCacheMock.Setup(x => x.GetConferenceAsync(_testConference.Id)).ReturnsAsync(_testConference);
            var conferenceId = _testConference.Id;
            var participantId = Guid.NewGuid();

            var request = new UpdateParticipantRequest
            {
                Fullname = "Judge Stive Adams",
                Display_name ="Sir Steve",
                Representee=""
            };
            _videoApiClientMock
                .Setup(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(),It.IsAny<Guid>(), request ))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.UpdateParticipantDisplayNameAsync(conferenceId, participantId, request);
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_throw_error_when_get_api_throws_error()
        {

            var conferenceId = _testConference.Id;
            var request = new UpdateParticipantRequest
            {
                Fullname = "Judge Stive Adams",
                Display_name = "Sir Steve",
                Representee = ""
            };
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id and participant Id", null, default, null);
            _videoApiClientMock
                .Setup(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), request))
                .ThrowsAsync(apiException);

            var result = await _controller.UpdateParticipantDisplayNameAsync(conferenceId, Guid.NewGuid(), request);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}
