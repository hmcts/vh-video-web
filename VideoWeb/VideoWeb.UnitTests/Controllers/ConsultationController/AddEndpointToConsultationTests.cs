using System;
using System.Net;
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
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoWeb.UnitTests.Builders;
using ConsultationAnswer = VideoWeb.Common.Models.ConsultationAnswer;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class AddEndpointToConsultationTests
    {
        private AutoMock _mocker;
        private ConsultationsController _sut;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            _testConference = ConsultationHelper.BuildConferenceForTest();

            _mocker.Mock<IHubClients<IEventHubClient>>().Setup(x => x.Group(It.IsAny<string>())).Returns(_mocker.Mock<IEventHubClient>().Object);
            _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>().Setup(x => x.Clients).Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);

            _sut = _mocker.Create<ConsultationsController>();
        }

        [Test]
        public async Task should_return_accepted()
        {
            // Arrange
            SetupControllerWithClaims("john@hmcts.net");
            var request = new AddEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = Guid.NewGuid(),
                RoomLabel = "RoomLabel"
            };

            // Act
            var result = await _sut.AddEndpointToConsultationAsync(request);

            // Assert
            result.Should().BeOfType<AcceptedResult>();
        }

        [Test]
        public async Task should_return_unauthorised_not_in_conference()
        {
            // Arrange
            SetupControllerWithClaims("not_in_conference@hmcts.net");
            var request = new AddEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id
            };

            // Act
            var result = await _sut.AddEndpointToConsultationAsync(request);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Test]
        public async Task should_return_call_JoinEndpointToConsultationAsync_with_correct_params()
        {
            // Arrange
            SetupControllerWithClaims(_testConference.Participants[1].Username);
            var request = new AddEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = Guid.NewGuid(),
                RoomLabel = "RoomLabel"
            };

            // Act
            var result = await _sut.AddEndpointToConsultationAsync(request);

            // Assert
            result.Should().BeOfType<AcceptedResult>();

            _mocker.Mock<IVideoApiClient>().Verify(x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(r => r.EndpointId == request.EndpointId && r.ConferenceId == request.ConferenceId && r.RequestedById == _testConference.Participants[1].Id)), Times.Once);
            _mocker.Mock<IEventHubClient>().Verify(x => x.ConsultationRequestResponseMessage(_testConference.Id, request.RoomLabel, request.EndpointId, ConsultationAnswer.Transferring), Times.Exactly(_testConference.Participants.Count));
        }

        [Test]
        public async Task should_return_call_videoapi_response_error_joining()
        {
            // Arrange
            SetupControllerWithClaims(_testConference.Participants[1].Username);
            var request = new AddEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = Guid.NewGuid(),
                RoomLabel = "RoomLabel"
            };
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _mocker.Mock<IVideoApiClient>().Setup(x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(r => r.EndpointId == request.EndpointId && r.ConferenceId == request.ConferenceId && r.RequestedById == _testConference.Participants[1].Id)))
                .Throws(apiException);

            // Act
            var result = await _sut.AddEndpointToConsultationAsync(request);

            // Assert
            result.Should().BeOfType<StatusCodeResult>();
            var statusCodeResult = result as StatusCodeResult;
            statusCodeResult.StatusCode.Should().Be(apiException.StatusCode);

            _mocker.Mock<IVideoApiClient>().Verify(x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(r => r.EndpointId == request.EndpointId && r.ConferenceId == request.ConferenceId && r.RequestedById == _testConference.Participants[1].Id)), Times.Once);
            _mocker.Mock<IEventHubClient>().Verify(x => x.ConsultationRequestResponseMessage(_testConference.Id, request.RoomLabel, request.EndpointId, ConsultationAnswer.Transferring), Times.Exactly(_testConference.Participants.Count));
            _mocker.Mock<IEventHubClient>().Verify(x => x.ConsultationRequestResponseMessage(_testConference.Id, request.RoomLabel, request.EndpointId, ConsultationAnswer.Failed), Times.Exactly(_testConference.Participants.Count));
        }

        private void SetupControllerWithClaims(string username)
        {
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername(username).Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = cp
                }
            };

            _sut.ControllerContext = context;
        }
    }
}
