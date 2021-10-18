using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Client;
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

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.JoinHearingInSession(TestConference.Id, participantId);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            VideoApiClientMock.Verify(
                x => x.TransferParticipantAsync(It.IsAny<Guid>(), It.IsAny<TransferParticipantRequest>()), Times.Never);
        }

        [TestCase(AppRoles.JudgeRole)]
        [TestCase(AppRoles.StaffMember)]
        public async Task Returns_unauthorised_if_host_not_assigned_to_conference(string role)
        {
            var user = new ClaimsPrincipalBuilder()
                .WithUsername("notforconference@hmcts.net")
                .WithRole(role).Build();

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.JoinHearingInSession(TestConference.Id, participantId);
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            VideoApiClientMock.Verify(
                x => x.TransferParticipantAsync(TestConference.Id, It.IsAny<TransferParticipantRequest>()), Times.Never);
        }

        [Test]
        public async Task Returns_video_api_error()
        {
            var participant = TestConference.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            Controller = SetupControllerWithClaims(user);

            var responseMessage = "Could not start a video hearing";
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                responseMessage, null, default, null);
            VideoApiClientMock
                .Setup(x => x.TransferParticipantAsync(TestConference.Id, It.IsAny<TransferParticipantRequest>()))
                .ThrowsAsync(apiException);

            var result = await Controller.JoinHearingInSession(TestConference.Id, participantId);
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be(responseMessage);
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        }

        [TestCase(AppRoles.JudgeRole)]
        [TestCase(AppRoles.StaffMember)]
        public async Task Returns_accepted_when_user_is_dual_host(string role)
        {
            var participant = TestConference.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(role).Build();

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.JoinHearingInSession(TestConference.Id, participantId);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            VideoApiClientMock.Verify(x => x.TransferParticipantAsync(TestConference.Id,It.Is<TransferParticipantRequest>(request => request.ParticipantId == participantId && request.TransferType == TransferType.Call)), Times.Once);
        }
    }
}
