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
using RoomType = VideoWeb.EventHub.Enums.RoomType;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class RespondToAdminConsultationRequestTests
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
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            _memoryCache.Remove(_testConference.Id);
            var consultationRequest = ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.None);
            var result = await _controller.RespondToAdminConsultationRequest(consultationRequest);

            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_participant_not_found_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = new Conference { Id = Guid.NewGuid() };
            _memoryCache.Set(conference.Id, conference);

            var consultationRequest = Builder<AdminConsultationRequest>.CreateNew().With(x => x.Conference_id = conference.Id).Build();
            var result = await _controller.RespondToAdminConsultationRequest(consultationRequest);

            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_no_content_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.RespondToAdminConsultationRequest(ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.None));
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default(ProblemDetails), null);
            
            _videoApiClientMock
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .ThrowsAsync(apiException);
            
            var result = await _controller.RespondToAdminConsultationRequest(ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.None));
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_send_message_to_clients_when_answer_accepted()
        {
            _videoApiClientMock
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>())).Returns(Task.FromResult(HttpStatusCode.NoContent));

            var adminConsultationRequest = ConsultationHelper.GetAdminConsultationRequest(_testConference, ConsultationAnswer.Accepted);
            var result = await _controller.RespondToAdminConsultationRequest(adminConsultationRequest);
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();

            _eventHubClientMock.Verify(
                x => x.AdminConsultationMessage
                    (_testConference.Id, RoomType.ConsultationRoom1, _testConference.Participants[0].Username.ToLowerInvariant(), 
                    EventHub.Enums.ConsultationAnswer.Accepted));

        }

    }
}