using System;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
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
        private AutoMock _mocker;
        private ConsultationsController _sut;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
           

            _testConference = ConsultationHelper.BuildConferenceForTest();

            var eventHubContextMock = _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            var eventHubClientMock = _mocker.Mock<IEventHubClient>();
            foreach (var participant in _testConference.Participants)
            {
                eventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                    .Returns(eventHubClientMock.Object);
            }

            eventHubContextMock.Setup(x => x.Clients.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(eventHubClientMock.Object);

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);

            _sut = SetupControllerWithClaims(null);
        }

        [Test]
        public async Task should_return_not_found_if_defence_advocate_is_not_found()
        {
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername("nf@test.com").Build();
            _sut = SetupControllerWithClaims(cp);
            
            var request = new PrivateVideoEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = _testConference.Endpoints.First(x => !string.IsNullOrWhiteSpace(x.DefenceAdvocateUsername))
                    .Id
            };
            var result = await _sut.CallVideoEndpointAsync(request);
            var actionResult = result.As<NotFoundObjectResult>();
            actionResult.Should().NotBeNull();
            actionResult.Value.Should().Be($"Defence advocate does not exist in conference {request.ConferenceId}");
        }
        
        [Test]
        public async Task should_return_not_found_if_endpoint_is_not_found()
        {
            var request = new PrivateVideoEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = Guid.NewGuid()
            };
            var result = await _sut.CallVideoEndpointAsync(request);
            var actionResult = result.As<NotFoundObjectResult>();
            actionResult.Should().NotBeNull();
            actionResult.Value.Should().Be($"No endpoint id {request.EndpointId} exists");
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
            var result = await _sut.CallVideoEndpointAsync(request);
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

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.StartConsultationWithEndpointAsync(It.IsAny<EndpointConsultationRequest>()))
                .ThrowsAsync(apiException);
            
            var result = await _sut.CallVideoEndpointAsync(request);
            var actionResult = result.As<ObjectResult>();
            actionResult.Should().NotBeNull();
            actionResult.StatusCode.Should().Be((int) HttpStatusCode.Unauthorized);
        }
        
        private ConsultationsController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var cp = claimsPrincipal ?? new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername("rep1@test.com").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = cp
                }
            };

            var controller = _mocker.Create<ConsultationsController>();
            controller.ControllerContext = context;
            return controller;
        }
    }
}
