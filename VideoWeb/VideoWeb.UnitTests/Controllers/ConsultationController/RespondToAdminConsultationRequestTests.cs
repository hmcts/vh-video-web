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
    public class RespondToAdminConsultationRequestTests
    {
        private AutoMock _mocker;
        private ConsultationsController _controller;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var eventHubClientMock = _mocker.Mock<IEventHubClient>();
            var eventHubContextMock = _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();

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

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<PrivateConsultationRequest, ConsultationRequest>()).Returns(_mocker.Create<PrivateConsultationRequestMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Dictionary<string, string[]>, BadRequestModelResponse>()).Returns(_mocker.Create<BadRequestResponseMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<LeavePrivateConsultationRequest, LeaveConsultationRequest>()).Returns(_mocker.Create<LeavePrivateConsultationRequestMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<PrivateAdminConsultationRequest, AdminConsultationRequest>()).Returns(_mocker.Create<PrivateAdminConsultationRequestMapper>());

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
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = new Conference {Id = Guid.NewGuid()};

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var consultationRequest = Builder<PrivateAdminConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id).Build();
            var result = await _controller.RespondToAdminConsultationRequestAsync(consultationRequest);

            var typedResult = (NotFoundResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_no_content_when_request_is_sent()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.RespondToAdminConsultationRequestAsync(
                ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.None));
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.ConsultationRequestResponseMessage
                    (It.IsAny<Guid>(), It.IsAny<RoomType>(), It.IsAny<string>(), It.IsAny<ConsultationAnswer>()),
                Times.Never);
        }

        [Test]
        public async Task Should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.RespondToAdminConsultationRequestAsync(
                ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.None));
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_send_message_to_clients_when_answer_accepted()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .Returns(Task.FromResult(HttpStatusCode.NoContent));

            var adminConsultationRequest =
                ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.Accepted);
            var result = await _controller.RespondToAdminConsultationRequestAsync(adminConsultationRequest);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IEventHubClient>().Verify(
                x => x.ConsultationRequestResponseMessage
                (_testConference.Id, RoomType.ConsultationRoom1,
                    _testConference.Participants[0].Username.ToLowerInvariant(),
                    ConsultationAnswer.Accepted), Times.Once);

        }
    }
}
