using System;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class CallVideoEndpointTests
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

            _conferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);

            _controller = SetupControllerWithClaims(null);
        }

        [Test]
        public async Task should_return_unauthorized_if_user_is_not_representative()
        {
            var cp = new ClaimsPrincipalBuilder().WithRole(Role.Individual)
                .WithUsername("rep1@test.com").Build();
            _controller = SetupControllerWithClaims(cp);
            
            var request = new PrivateVideoEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = _testConference.Endpoints.First(x => !string.IsNullOrWhiteSpace(x.DefenceAdvocateUsername))
                    .Id
            };
            var result = await _controller.CallVideoEndpointAsync(request);
            var actionResult = result.As<UnauthorizedObjectResult>();
            actionResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task should_return_not_found_if_defence_advocate_is_not_found()
        {
            var cp = new ClaimsPrincipalBuilder().WithRole(Role.Representative)
                .WithUsername("nf@test.com").Build();
            _controller = SetupControllerWithClaims(cp);
            
            var request = new PrivateVideoEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = _testConference.Endpoints.First(x => !string.IsNullOrWhiteSpace(x.DefenceAdvocateUsername))
                    .Id
            };
            var result = await _controller.CallVideoEndpointAsync(request);
            var actionResult = result.As<NotFoundObjectResult>();
            actionResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task should_return_not_found_if_endpoint_is_not_found()
        {
            var request = new PrivateVideoEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = Guid.NewGuid()
            };
            var result = await _controller.CallVideoEndpointAsync(request);
            var actionResult = result.As<NotFoundObjectResult>();
            actionResult.Should().NotBeNull();
            
        }
        
        [Test]
        public async Task should_return_accepted_request_is_successful()
        {
            var request = new PrivateVideoEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = _testConference.Endpoints.First(x => !string.IsNullOrWhiteSpace(x.DefenceAdvocateUsername))
                    .Id
            };
            var result = await _controller.CallVideoEndpointAsync(request);
            var actionResult = result.As<AcceptedResult>();
            actionResult.Should().NotBeNull();
        }

        [Test]
        public async Task should_return_api_exception_status_code()
        {
            var apiException = new VideoApiException<ProblemDetails>("Defence advocate is not linked to endpoint", (int) HttpStatusCode.Unauthorized,
                "Defence advocate is not linked to endpoint", null, default, null);
            
            var request = new PrivateVideoEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = _testConference.Endpoints.First(x => !string.IsNullOrWhiteSpace(x.DefenceAdvocateUsername))
                    .Id
            };

            _videoApiClientMock
                .Setup(x => x.StartPrivateConsultationWithEndpointAsync(It.IsAny<EndpointConsultationRequest>()))
                .ThrowsAsync(apiException);
            
            var result = await _controller.CallVideoEndpointAsync(request);
            var actionResult = result.As<ObjectResult>();
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be((int) HttpStatusCode.Unauthorized);
        }
        
        private ConsultationsController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var cp = claimsPrincipal ?? new ClaimsPrincipalBuilder().WithRole(Role.Representative)
                .WithUsername("rep1@test.com").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = cp
                }
            };

            return new ConsultationsController(_videoApiClientMock.Object, _eventHubContextMock.Object,
                _conferenceCacheMock.Object, _loggerMock.Object)
            {
                ControllerContext = context
            };
        }
    }
}
