using System;
using System.Linq;
using System.Security.Claims;
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
using VideoWeb.Common;
using VideoWeb.EventHub.Services;
using VideoWeb.UnitTests.Builders;

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
            _mocker.Mock<IHubContext<EventHub.Hub.EventHubVIH11189, IEventHubClient>>().Setup(x => x.Clients).Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);
            _mocker.Mock<IConferenceService>()
                .Setup(x => x.GetConference(It.Is<Guid>(y => y == _testConference.Id), It.IsAny<CancellationToken>()))
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
            var result = await _sut.InviteToConsultationAsync(request, CancellationToken.None);

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
            var result = await _sut.InviteToConsultationAsync(request, CancellationToken.None);

            // Assert
            result.Should().BeOfType<AcceptedResult>();
            _mocker.Mock<IConsultationNotifier>()
                .Verify(
                    x => x.NotifyConsultationRequestAsync(_testConference, "Room1", Guid.Empty,
                        _testConference.Participants[0].Id), Times.Once);
        }

        [Test]
        public async Task should_return_accepted_if_user_is_in_consultation()
        {
            // Arrange
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername("rep1@hmcts.net").Build();
            _sut = SetupControllerWithClaims(cp);
            var participant = _testConference.Participants.First(x => x.Role == Role.Individual);

            var request = new InviteToConsultationRequest
            {
                ConferenceId = _testConference.Id,
                ParticipantId = participant.Id,
                RoomLabel = "Room1"
            };

            // Act
            var result = await _sut.InviteToConsultationAsync(request, CancellationToken.None);

            // Assert
            result.Should().BeOfType<AcceptedResult>();
            _mocker.Mock<IConsultationNotifier>()
                .Verify(
                    x => x.NotifyConsultationRequestAsync(_testConference, "Room1", _testConference.Participants[2].Id,
                        participant.Id), Times.Once);
        }

        [Test]
        public async Task should_return_badrequest_if_invitee_is_screened_from_existing_participant_in_room()
        {
            // arrange
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername("rep1@hmcts.net").Build();
            _sut = SetupControllerWithClaims(cp);
            
            var roomLabel = "RoomLabel1";
            var individual = _testConference.Participants.Find(x => x.Role == Role.Individual);
            var endpoint = _testConference.Endpoints[0];
            individual.ProtectFrom.Add(endpoint.ExternalReferenceId);
            var rep = _testConference.Participants.Find(x => x.Role == Role.Representative);
            
            rep.CurrentRoom = new ConsultationRoom {Label = roomLabel};
            rep.Username = "rep1@hmcts.net";
            endpoint.CurrentRoom = new ConsultationRoom {Label = roomLabel};

            var request = new InviteToConsultationRequest
            {
                ConferenceId = _testConference.Id,
                RoomLabel = roomLabel,
                ParticipantId = individual.Id
            };
            
            // act
            var result = await _sut.InviteToConsultationAsync(request, CancellationToken.None);
            
            // assert
            result.Should().BeOfType<BadRequestObjectResult>().Which.Value.Should()
                .Be(ConsultationsController.ConsultationHasScreenedParticipantErrorMessage);
            
            _mocker.Mock<IConsultationNotifier>().Verify(
                x => x.NotifyConsultationRequestAsync(_testConference, roomLabel, Guid.Empty, individual.Id), Times.Never);
        }

        [Test]
        public async Task should_return_badrequest_if_invitee_is_an_observer()
        {
            // arrange
            var cp = new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername("rep1@hmcts.net").Build();
            _sut = SetupControllerWithClaims(cp);
            
            var roomLabel = "RoomLabel1";
            var observer = _testConference.Participants.Find(x => x.Role == Role.QuickLinkObserver);
            var rep = _testConference.Participants.Find(x => x.Role == Role.Representative);
            
            rep.CurrentRoom = new ConsultationRoom {Label = roomLabel};
            rep.Username = "rep1@hmcts.net";

            var request = new InviteToConsultationRequest
            {
                ConferenceId = _testConference.Id,
                RoomLabel = roomLabel,
                ParticipantId = observer.Id
            };
            
            // act
            var act = async () => await _sut.InviteToConsultationAsync(request, CancellationToken.None);
            
            // assert
            await act.Should().ThrowAsync<BadRequestException>()
                .WithMessage($"The participant {observer.Id} is an observer and cannot join a consultation room");
            
            _mocker.Mock<IConsultationNotifier>().Verify(
                x => x.NotifyConsultationRequestAsync(_testConference, roomLabel, Guid.Empty, observer.Id), Times.Never);
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
