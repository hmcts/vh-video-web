using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class DismissParticipantTests : ConferenceManagementControllerTestBase
    {
        [SetUp]
        public void Setup()
        {
            TestConference = BuildConferenceForTest(true);
        }

        [Test]
        public async Task should_return_unauthorised_if_participant_is_not_a_witness()
        {
            var judge = TestConference.GetJudge();
            var invalidParticipants = TestConference.Participants.Where(x => !x.IsJudge() && !x.IsWitness() && !x.IsQuickLinkUser() && x.LinkedParticipants.Count == 0);
            var user = new ClaimsPrincipalBuilder()
              .WithUsername(judge.Username)
              .WithRole(AppRoles.JudgeRole).Build();

            Controller = SetupControllerWithClaims(user);

            foreach (var participant in invalidParticipants)
            {
                var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id);
                var typedResult = (UnauthorizedObjectResult)result;
                typedResult.Should().NotBeNull();
                typedResult.Value.Should().Be("Participant is not callable");

                VideoApiClientMock.Verify(
                    x => x.TransferParticipantAsync(TestConference.Id,
                        It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
            }
        }

        [Test]
        public async Task should_return_unauthorised_if_participant_does_not_exists()
        {
            var judge = TestConference.GetJudge();
            var participant = TestConference.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
              .WithUsername(judge.Username)
              .WithRole(AppRoles.JudgeRole).Build();

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, Guid.NewGuid());
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("Participant is not callable");

            VideoApiClientMock.Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
        }

        [Test]
        public async Task should_return_unauthorised_if_not_judge_conference()
        {
            var participant = TestConference.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.CitizenRole).Build();

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id);
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be a Judge");

            VideoApiClientMock.Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
        }

        [Test]
        public async Task should_return_video_api_error()
        {
            var judge = TestConference.GetJudge();
            var witness = TestConference.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            Controller = SetupControllerWithClaims(user);

            var responseMessage = "Could not start transfer participant";
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                responseMessage, null, default, null);

            VideoApiClientMock.Setup(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.IsAny<TransferParticipantRequest>())).ThrowsAsync(apiException);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, witness.Id);
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult)result;
            typedResult.Value.Should().Be(responseMessage);
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        }

        [Test]
        public async Task should_return_accepted_when_participant_is_witness_and_judge_is_in_conference()
        {
            var judge = TestConference.GetJudge();
            var witness = TestConference.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, witness.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            VideoApiClientMock.Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == witness.Id && r.TransferType == TransferType.Dismiss)), Times.Once);
        }

        [Test]
        [TestCase(Role.QuickLinkObserver, "Observer")]
        [TestCase(Role.QuickLinkParticipant, "Participant")]
        public async Task should_create_an_alert_when_the_quick_link_user_is_dismissed(Role role, string expectedPrefix)
        {

            var judge = TestConference.GetJudge();
            var participant = TestConference.Participants.First(x => x.Role == role);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{expectedPrefix} dismissed by {judge.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();


            VideoApiClientMock.Verify(x => x.AddTaskAsync(TestConference.Id,
                It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant)),
                Times.Once);
        }

        [Test]
        public async Task should_create_an_alert_when_the_witness_is_dismissed()
        {

            var judge = TestConference.GetJudge();
            var participant = TestConference.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{participant.HearingRole} dismissed by {judge.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();


            VideoApiClientMock.Verify(x => x.AddTaskAsync(TestConference.Id,
                It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant)),
                Times.Once);
        }

        [Test]
        [TestCase(Role.Judge, AppRoles.JudgeRole)]
        public async Task should_create_an_alert_with_the_correct_dismisser_role_when_the_witness_is_dismissed(Role dismisserRole, string appRole)
        {
            var dismisser = TestConference.Participants.First(x => x.Role == dismisserRole);
            var participant = TestConference.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(dismisser.Username)
                .WithRole(appRole).Build();
            Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{participant.HearingRole} dismissed by {dismisser.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();


            VideoApiClientMock.Verify(x => x.AddTaskAsync(TestConference.Id,
                It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant)),
                Times.Once);
        }

        [Test]
        public async Task should_return_accepted_when_participant_is_a_room()
        {
            var judge = TestConference.GetJudge();
            var room = TestConference.CivilianRooms.First();
            var participant = TestConference.Participants.First(x => x.IsWitness() && room.Participants.Contains(x.Id));
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{participant.HearingRole} dismissed by {judge.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            VideoApiClientMock.Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == participant.Id && r.TransferType == TransferType.Dismiss)), Times.Once);

            VideoApiClientMock.Verify(x => x.AddTaskAsync(TestConference.Id,
                    It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant)),
                Times.Once);
        }

        [Test]
        public async Task should_return_video_api_error_for_add_task()
        {
            var judge = TestConference.GetJudge();
            var witness = TestConference.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            Controller = SetupControllerWithClaims(user);

            var responseMessage = "Could not add dismiss alert for participant";
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                responseMessage, null, default, null);

            VideoApiClientMock.Setup(
                x => x.AddTaskAsync(TestConference.Id,
                    It.IsAny<AddTaskRequest>())).ThrowsAsync(apiException);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, witness.Id);
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult)result;
            typedResult.Value.Should().Be(responseMessage);
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        }

        [Test]
        [TestCase(Role.QuickLinkObserver)]
        [TestCase(Role.QuickLinkParticipant)]
        public async Task should_return_accepted_when_participant_is_quick_link_user_and_judge_is_in_conference(Role role)
        {
            var judge = TestConference.GetJudge();
            var quickLinkUser = TestConference.Participants.First(x => x.Role == role);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, quickLinkUser.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            VideoApiClientMock.Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == quickLinkUser.Id && r.TransferType == TransferType.Dismiss)), Times.Once);
        }
    }
}
