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
    public class InviteToConsultationTests
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

            _sut = SetupControllerWithClaims(null);
        }

        [Test]
        public async Task should_return_unauthorized_if_user_is_not_in_conference_or_vh_officer()
        {
            // Arrange
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername("nf@test.com").Build();
            _sut = SetupControllerWithClaims(cp);
            
            var request = new InviteToConsultationRequest
            {
                ConferenceId = _testConference.Id,
                ParticipantId = _testConference.Participants[0].Id,
                RoomLabel = "Room1"
            };

            // Act
            var result = await _sut.InviteToConsultationAsync(request);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Test]
        public async Task should_return_accepted_if_user_is_vh_officer()
        {
            // Arrange
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole)
                .WithUsername("nf@test.com").Build();
            _sut = SetupControllerWithClaims(cp);

            var request = new InviteToConsultationRequest
            {
                ConferenceId = _testConference.Id,
                ParticipantId = _testConference.Participants[0].Id,
                RoomLabel = "Room1"
            };

            // Act
            var result = await _sut.InviteToConsultationAsync(request);

            // Assert
            result.Should().BeOfType<AcceptedResult>();
            _mocker.Mock<IEventHubClient>().Verify(x => x.RequestedConsultationMessage(_testConference.Id, "Room1", Guid.Empty, _testConference.Participants[0].Id),
                Times.Exactly(_testConference.Participants.Count));
        }

        [Test]
        public async Task should_return_accepted_if_user_is_in_consultation()
        {
            // Arrange
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername("rep1@hmcts.net").Build();
            _sut = SetupControllerWithClaims(cp);

            var request = new InviteToConsultationRequest
            {
                ConferenceId = _testConference.Id,
                ParticipantId = _testConference.Participants[0].Id,
                RoomLabel = "Room1"
            };

            // Act
            var result = await _sut.InviteToConsultationAsync(request);

            // Assert
            result.Should().BeOfType<AcceptedResult>();
            _mocker.Mock<IEventHubClient>().Verify(x => x.RequestedConsultationMessage(_testConference.Id, "Room1", _testConference.Participants[2].Id, _testConference.Participants[0].Id),
                Times.Exactly(_testConference.Participants.Count));
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
