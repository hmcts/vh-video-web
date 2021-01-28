using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Requests;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ConsultationAnswer = VideoWeb.Common.Models.ConsultationAnswer;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using RoomType = VideoWeb.Common.Models.RoomType;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class RequestConsultationTests
    {
        private AutoMock _mocker;
        private ConsultationsController _controller;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var eventHubContextMock = _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            var eventHubClientMock = _mocker.Mock<IEventHubClient>();

            _testConference = ConsultationHelper.BuildConferenceForTest();

            foreach (var participant in _testConference.Participants)
            {
                eventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                    .Returns(eventHubClientMock.Object);
            }

            eventHubContextMock.Setup(x => x.Clients.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(eventHubClientMock.Object);

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<PrivateConsultationRequest, ConsultationRequestResponse>()).Returns(_mocker.Create<PrivateConsultationRequestMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Dictionary<string, string[]>, BadRequestModelResponse>()).Returns(_mocker.Create<BadRequestResponseMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<LeavePrivateConsultationRequest, LeaveConsultationRequest>()).Returns(_mocker.Create<LeavePrivateConsultationRequestMapper>());

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);

            _controller = _mocker.Create<ConsultationsController>();
            _controller.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_participant_not_found_when_request_is_sent()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .Returns(Task.FromResult(default(object)));
            var conference = new Conference {Id = Guid.NewGuid()};
            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var consultationRequest = Builder<PrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id).Build();
            var result = await _controller.RespondToConsultationRequestAsync(consultationRequest);

            var typedResult = (NotFoundResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_no_content_when_request_is_sent()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .Returns(Task.FromResult(default(object)));

            var result =
                await _controller.RespondToConsultationRequestAsync(
                    ConsultationHelper.GetConsultationRequest(_testConference));
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.ConsultationRequestResponseMessage
                    (It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<ConsultationAnswer>()),
                Times.Never);
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "{\"ConsultationRoom\":[\"No consultation room available\"]}", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .ThrowsAsync(apiException);

            var result =
                await _controller.RespondToConsultationRequestAsync(
                    ConsultationHelper.GetConsultationRequest(_testConference));
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException("Internal Server Error",
                (int) HttpStatusCode.InternalServerError, "The server collapse due to unhandled error", default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .ThrowsAsync(apiException);

            var result =
                await _controller.RespondToConsultationRequestAsync(
                    ConsultationHelper.GetConsultationRequest(_testConference));
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_send_message_to_other_party_when_requested()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .Returns(Task.FromResult(HttpStatusCode.NoContent));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            var result = await _controller.RespondToConsultationRequestAsync(consultationRequest);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IEventHubClient>().Verify(x => x.ConsultationRequestResponseMessage(_testConference.Id, consultationRequest.RoomLabel, consultationRequest.RequestedForId, consultationRequest.Answer));
        }

        [TestCase(ConsultationAnswer.None)]
        [TestCase(ConsultationAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Rejected)]
        public async Task Should_send_message_to_other_party_when_answered(ConsultationAnswer answer)
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .Returns(Task.FromResult(HttpStatusCode.NoContent));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            consultationRequest.Answer = answer;
            var result = await _controller.RespondToConsultationRequestAsync(consultationRequest);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IEventHubClient>().Verify(x => x.ConsultationRequestResponseMessage(_testConference.Id, consultationRequest.RoomLabel, consultationRequest.RequestedForId, consultationRequest.Answer));
        }

        [Test]
        public void Should_throw_InvalidOperationException_two_participants_with_the_same_requeste_by_found()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .Returns(Task.FromResult(default(object)));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            var findId = consultationRequest.RequestedById;
            _testConference.Participants[0].Id = findId;
            _testConference.Participants[1].Id = findId;

            Assert.ThrowsAsync<InvalidOperationException>(() =>
                _controller.RespondToConsultationRequestAsync(consultationRequest));
        }

        [Test]
        public void Should_throw_InvalidOperationException_two_participants_with_the_same_requeste_for_found()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .Returns(Task.FromResult(default(object)));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            var findId = consultationRequest.RequestedForId;
            _testConference.Participants[0].Id = findId;
            _testConference.Participants[1].Id = findId;
            _testConference.Participants[2].Id = consultationRequest.RequestedById;

            Assert.ThrowsAsync<InvalidOperationException>(() =>
                _controller.RespondToConsultationRequestAsync(consultationRequest));
        }

        [Test]
        public async Task Should_throw_InvalidOperationException_no_participants_requested_by_found()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .Returns(Task.FromResult(default(object)));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            foreach (var item in _testConference.Participants)
            {
                item.Id = Guid.NewGuid();
            }


            var result = await _controller.RespondToConsultationRequestAsync(consultationRequest);
            var typedResult = (NotFoundResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_throw_InvalidOperationException_no_participants_requested_for_found()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .Returns(Task.FromResult(default(object)));

            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            _testConference.Participants[0].Id = Guid.NewGuid();
            _testConference.Participants[1].Id = Guid.NewGuid();
            _testConference.Participants[2].Id = consultationRequest.RequestedById;

            var result = await _controller.RespondToConsultationRequestAsync(consultationRequest);
            var typedResult = (NotFoundResult) result;
            typedResult.Should().NotBeNull();
        }
    }
}
