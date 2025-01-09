using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class JoinHearingInSessionTests : ConferenceManagementControllerTestBase
    {
        private Guid participantId;

        [SetUp]
        public void Setup()
        {
            participantId = Guid.NewGuid();
            TestConference = BuildConferenceForTest();
        }

        [Test]
        public async Task Returns_unauthorised_if_user_not_judge()
        {
            var participant = TestConference.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.CitizenRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.JoinHearingInSession(TestConference.Id, participantId, CancellationToken.None);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(It.IsAny<Guid>(), It.IsAny<TransferParticipantRequest>()), Times.Never);
        }

        [TestCase(AppRoles.JudgeRole)]
        [TestCase(AppRoles.StaffMember)]
        public async Task Returns_unauthorised_if_host_not_assigned_to_conference(string role)
        {
            var user = new ClaimsPrincipalBuilder()
                .WithUsername("notforconference@hmcts.net")
                .WithRole(role).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.JoinHearingInSession(TestConference.Id, participantId, CancellationToken.None);
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id, It.IsAny<TransferParticipantRequest>()), Times.Never);
        }

        [TestCase(AppRoles.JudgeRole, Role.Judge)]
        [TestCase(AppRoles.StaffMember, Role.StaffMember)]
        public async Task Returns_accepted_when_user_is_dual_host(string role, Role userRole)
        {
            var participant = TestConference.Participants.First(x => x.Role == userRole);
            participantId = participant.Id;
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(role).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.JoinHearingInSession(TestConference.Id, participantId, CancellationToken.None);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>()
                .Verify(
                    x => x.TransferParticipantAsync(TestConference.Id,
                        It.Is<TransferParticipantRequest>(request =>
                            request.ParticipantId == participantId && request.TransferType == TransferType.Call && request.ConferenceRole == ConferenceRole.Host), It.IsAny<CancellationToken>()),
                    Times.Once);
        }
    }
}
