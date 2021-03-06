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
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoWeb.UnitTests.Builders;
using ConsultationAnswer = VideoWeb.Common.Models.ConsultationAnswer;

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

            _testConference = ConsultationHelper.BuildConferenceForTest();

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _mocker.Mock<IHubClients<IEventHubClient>>().Setup(x => x.Group(It.IsAny<string>())).Returns(_mocker.Mock<IEventHubClient>().Object);
            _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>().Setup(x => x.Clients).Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);

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
            // Arrange
            var conference = new Conference {Id = Guid.NewGuid()};
            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var consultationRequest = Builder<PrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id).Build();

            // Act
            var result = await _controller.RespondToConsultationRequestAsync(consultationRequest);

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }

        [Test]
        public async Task Should_return_no_content_when_request_is_sent()
        {
            // Arrange
            
            // Act
            var result =
                await _controller.RespondToConsultationRequestAsync(
                    ConsultationHelper.GetConsultationRequest(_testConference));

            // Assert
            result.Should().BeOfType<NoContentResult>();
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.ConsultationRequestResponseMessage
                    (It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<ConsultationAnswer>()),
                Times.Exactly(_testConference.Participants.Count));
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            // Arrange
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "{\"ConsultationRoom\":[\"No consultation room available\"]}", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .ThrowsAsync(apiException);

            // Act
            var result =
                await _controller.RespondToConsultationRequestAsync(
                    ConsultationHelper.GetConsultationRequest(_testConference));

            // Assert
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception()
        {
            // Arrange
            var apiException = new VideoApiException("Internal Server Error",
                (int) HttpStatusCode.InternalServerError, "The server collapse due to unhandled error", default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToConsultationRequestAsync(It.IsAny<ConsultationRequestResponse>()))
                .ThrowsAsync(apiException);
            
            // Act
            var result =
                await _controller.RespondToConsultationRequestAsync(
                    ConsultationHelper.GetConsultationRequest(_testConference));

            // Assert
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [TestCase(ConsultationAnswer.None)]
        [TestCase(ConsultationAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Rejected)]
        public async Task Should_send_message_to_other_party_when_answered(ConsultationAnswer answer)
        {
            // Arange
            var consultationRequest = ConsultationHelper.GetConsultationRequest(_testConference);
            consultationRequest.Answer = answer;

            // Act
            var result = await _controller.RespondToConsultationRequestAsync(consultationRequest);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            _mocker.Mock<IEventHubClient>().Verify(x => x.ConsultationRequestResponseMessage(_testConference.Id, consultationRequest.RoomLabel, consultationRequest.RequestedForId, consultationRequest.Answer),
                Times.Exactly(_testConference.Participants.Count));
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
            result.Should().BeOfType<NotFoundResult>();
        }

    }
}
