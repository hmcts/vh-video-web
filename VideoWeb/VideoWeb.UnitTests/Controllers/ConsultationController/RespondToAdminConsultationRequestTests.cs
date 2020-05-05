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
using RoomType = VideoWeb.EventHub.Enums.RoomType;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class RespondToAdminConsultationRequestTests
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
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = new Conference { Id = Guid.NewGuid() };

            _conferenceCacheMock.Setup(cache => cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var consultationRequest = Builder<AdminConsultationRequest>.CreateNew().With(x => x.Conference_id = conference.Id).Build();
            var result = await _controller.RespondToAdminConsultationRequestAsync(consultationRequest);

            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_no_content_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.RespondToAdminConsultationRequestAsync(ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.None));
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
            _eventHubClientMock.Verify(
                x => x.AdminConsultationMessage
                (It.IsAny<Guid>(), It.IsAny<RoomType>(), It.IsAny<string>(), It.IsAny<EventHub.Enums.ConsultationAnswer>()), Times.Never);
        }
        
        [Test]
        public async Task Should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            
            _videoApiClientMock
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .ThrowsAsync(apiException);
            
            var result = await _controller.RespondToAdminConsultationRequestAsync(ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.None));
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_send_message_to_clients_when_answer_accepted()
        {
            _videoApiClientMock
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>())).Returns(Task.FromResult(HttpStatusCode.NoContent));

            var adminConsultationRequest = ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.Accepted);
            var result = await _controller.RespondToAdminConsultationRequestAsync(adminConsultationRequest);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();

            _eventHubClientMock.Verify(
                x => x.AdminConsultationMessage
                    (_testConference.Id, RoomType.ConsultationRoom1, _testConference.Participants[0].Username.ToLowerInvariant(), 
                    EventHub.Enums.ConsultationAnswer.Accepted), Times.Once);

        }

    }
}
