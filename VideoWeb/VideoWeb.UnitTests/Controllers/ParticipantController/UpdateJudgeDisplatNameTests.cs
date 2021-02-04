using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoApi.Client;
using VideoWeb.UnitTests.Builders;
using EventHubEventType = VideoWeb.EventHub.Enums.EventType;
using UpdateParticipantRequest = VideoApi.Contract.Responses.UpdateParticipantRequest;
using Autofac.Extras.Moq;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class UpdateJudgeDisplatNameTests
    {
        private AutoMock _mocker;
        private ParticipantsController _sut;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            var eventHandlerMock = _mocker.Mock<IEventHandler>();
            _mocker.Mock<IEventHandlerFactory>().Setup(x => x.Get(It.IsAny<EventHubEventType>())).Returns(eventHandlerMock.Object);

            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();

            var eventComponentHelper = new EventComponentHelper();
            _testConference = eventComponentHelper.BuildConferenceForTest();
            _testConference.Participants[0].Username = ClaimsPrincipalBuilder.Username;

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _sut = _mocker.Create<ParticipantsController>();
            _sut.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_ok()
        {
            var conferenceId = _testConference.Id;
            var participantId = Guid.NewGuid();

            var request = new UpdateParticipantRequest
            {
                Fullname = "Judge Stive Adams",
                Display_name ="Sir Steve",
                Representee=""
            };
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(),It.IsAny<Guid>(), request ))
                .Returns(Task.FromResult(default(object)));

            var result = await _sut.UpdateParticipantDisplayNameAsync(conferenceId, participantId, request);
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
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), request))
                .ThrowsAsync(apiException);

            var result = await _sut.UpdateParticipantDisplayNameAsync(conferenceId, Guid.NewGuid(), request);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}
