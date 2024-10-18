using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.EventHub.Services;
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

            _mocker.Mock<IConferenceService>()
                .Setup(x => x.GetConference(It.Is<Guid>(y => y == _testConference.Id), It.IsAny<CancellationToken>()))
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
                EndpointId = _testConference.Endpoints[0].Id,
                RoomLabel = "RoomLabel"
            };

            // Act
            var result = await _sut.AddEndpointToConsultationAsync(request, CancellationToken.None);

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
            var result = await _sut.AddEndpointToConsultationAsync(request, CancellationToken.None);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Test]
        public async Task should_return_badrequest_when_endpoint_is_screened()
        {
            // arrange
            var roomLabel = "RoomLabel1";
            var individual = _testConference.Participants.Find(x => x.Role == Role.Individual);
            var endpoint = _testConference.Endpoints[0];
            individual.ProtectFrom.Add(endpoint.ExternalReferenceId);
            var rep = _testConference.Participants.Find(x => x.Role == Role.Representative);
            individual.CurrentRoom = new ConsultationRoom {Label = roomLabel};
            rep.CurrentRoom = new ConsultationRoom {Label = roomLabel};
            
            SetupControllerWithClaims(rep.Username);
            var request = new AddEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = endpoint.Id,
                RoomLabel = roomLabel
            };
            
            // act
            var result = await _sut.AddEndpointToConsultationAsync(request, CancellationToken.None);
            
            // assert
            result.Should().BeOfType<BadRequestObjectResult>().Which.Value.Should()
                .Be(ConsultationsController.ConsultationHasScreenedEndpointErrorMessage);
            
            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.JoinEndpointToConsultationAsync(It.IsAny<EndpointConsultationRequest>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Test]
        public async Task should_return_call_JoinEndpointToConsultationAsync_with_correct_params()
        {
            // Arrange
            SetupControllerWithClaims(_testConference.Participants[1].Username);
            var request = new AddEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = _testConference.Endpoints[0].Id,
                RoomLabel = "RoomLabel"
            };

            // Act
            var result = await _sut.AddEndpointToConsultationAsync(request, CancellationToken.None);

            // Assert
            result.Should().BeOfType<AcceptedResult>();

            _mocker.Mock<IVideoApiClient>()
                .Verify(
                    x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(r =>
                        r.EndpointId == request.EndpointId && r.ConferenceId == request.ConferenceId), It.IsAny<CancellationToken>()), Times.Once);
            _mocker.Mock<IConsultationNotifier>().Verify(x => x.NotifyConsultationResponseAsync(_testConference,
                Guid.Empty, request.RoomLabel, request.EndpointId, ConsultationAnswer.Transferring));
        }

        [Test]
        public async Task should_return_call_videoapi_response_error_joining()
        {
            // Arrange
            SetupControllerWithClaims(_testConference.Participants[1].Username);
            var request = new AddEndpointConsultationRequest
            {
                ConferenceId = _testConference.Id,
                EndpointId = _testConference.Endpoints[0].Id,
                RoomLabel = "RoomLabel"
            };
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _mocker.Mock<IVideoApiClient>().Setup(x =>
                    x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(r =>
                        r.EndpointId == request.EndpointId && r.ConferenceId == request.ConferenceId), It.IsAny<CancellationToken>()))
                .Throws(apiException);

            // Act
            var result = await _sut.AddEndpointToConsultationAsync(request, CancellationToken.None);

            // Assert
            result.Should().BeOfType<StatusCodeResult>();
            var statusCodeResult = result as StatusCodeResult;
            statusCodeResult.StatusCode.Should().Be(apiException.StatusCode);

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(r =>
                    r.EndpointId == request.EndpointId && r.ConferenceId == request.ConferenceId), It.IsAny<CancellationToken>()), Times.Once);

            _mocker.Mock<IConsultationNotifier>().Verify(x => x.NotifyConsultationResponseAsync(_testConference,
                Guid.Empty, request.RoomLabel, request.EndpointId, ConsultationAnswer.Transferring));
            
            _mocker.Mock<IConsultationNotifier>().Verify(x => x.NotifyConsultationResponseAsync(_testConference,
                Guid.Empty, request.RoomLabel, request.EndpointId, ConsultationAnswer.Failed));
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
