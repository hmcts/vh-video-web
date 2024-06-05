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
using VideoWeb.EventHub.Services;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class DismissParticipantTests : ConferenceManagementControllerTestBase
    {
        [SetUp]
        public void Setup()
        {
            TestConferenceDto = BuildConferenceForTest(true);
        }

        [Test]
        public async Task should_return_unauthorised_if_participant_is_not_a_witness()
        {
            var judge = TestConferenceDto.GetJudge();
            var invalidParticipants = TestConferenceDto.Participants.Where(x => !x.IsJudge() && !x.IsWitness() && !x.IsQuickLinkUser() && x.LinkedParticipants.Count == 0);
            var user = new ClaimsPrincipalBuilder()
              .WithUsername(judge.Username)
              .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);

            foreach (var participant in invalidParticipants)
            {
                var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, participant.Id);
                var typedResult = (UnauthorizedObjectResult)result;
                typedResult.Should().NotBeNull();
                typedResult.Value.Should().Be("Participant is not callable");

                _mocker.Mock<IVideoApiClient>().Verify(
                    x => x.TransferParticipantAsync(TestConferenceDto.Id,
                        It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
                
                _mocker.Mock<IConferenceManagementService>().Verify(
                    x => x.UpdateParticipantHandStatusInConference(TestConferenceDto.Id, participant.Id, false), Times.Never);
            }
        }

        [Test]
        public async Task should_return_unauthorised_if_participant_does_not_exists()
        {
            var judge = TestConferenceDto.GetJudge();
            var participant = TestConferenceDto.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
              .WithUsername(judge.Username)
              .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, Guid.NewGuid());
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("Participant is not callable");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConferenceDto.Id,
                    It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
            
            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.UpdateParticipantHandStatusInConference(TestConferenceDto.Id, participant.Id, false), Times.Never);
        }

        [Test]
        public async Task should_return_unauthorised_if_not_judge_conference()
        {
            var participant = TestConferenceDto.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.CitizenRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, participant.Id);
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConferenceDto.Id,
                    It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);

            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.UpdateParticipantHandStatusInConference(TestConferenceDto.Id, participant.Id, false), Times.Never);
        }

        [Test]
        public async Task should_return_video_api_error()
        {
            var judge = TestConferenceDto.GetJudge();
            var witness = TestConferenceDto.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var responseMessage = "Could not start transfer participant";
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                responseMessage, null, default, null);

            _mocker.Mock<IVideoApiClient>().Setup(
                x => x.TransferParticipantAsync(TestConferenceDto.Id,
                    It.IsAny<TransferParticipantRequest>())).ThrowsAsync(apiException);

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, witness.Id);
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult)result;
            typedResult.Value.Should().Be(responseMessage);
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
            
            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.UpdateParticipantHandStatusInConference(TestConferenceDto.Id, witness.Id, false), Times.Never);
        }

        [Test]
        public async Task should_return_accepted_when_participant_is_witness_and_judge_is_in_conference()
        {
            var judge = TestConferenceDto.GetJudge();
            var witness = TestConferenceDto.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, witness.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConferenceDto.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == witness.Id && r.TransferType == TransferType.Dismiss)), Times.Once);
            
            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.UpdateParticipantHandStatusInConference(TestConferenceDto.Id, witness.Id, false), Times.Once);
        }

        [Test]
        [TestCase(Role.QuickLinkObserver, "Observer")]
        [TestCase(Role.QuickLinkParticipant, "Participant")]
        public async Task should_create_an_alert_when_the_quick_link_user_is_dismissed(Role role, string expectedPrefix)
        {

            var judge = TestConferenceDto.GetJudge();
            var participant = TestConferenceDto.Participants.First(x => x.Role == role);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            var Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{expectedPrefix} dismissed by {judge.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, participant.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();


            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddTaskAsync(TestConferenceDto.Id,
                It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant)),
                Times.Once);
            
            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.UpdateParticipantHandStatusInConference(TestConferenceDto.Id, participant.Id, false), Times.Once);
        }

        [Test]
        public async Task should_create_an_alert_when_the_witness_is_dismissed()
        {

            var judge = TestConferenceDto.GetJudge();
            var participant = TestConferenceDto.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            var Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{participant.HearingRole} dismissed by {judge.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, participant.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();


            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddTaskAsync(TestConferenceDto.Id,
                It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant)),
                Times.Once);
        }

        [Test]
        [TestCase(Role.Judge, AppRoles.JudgeRole)]
        public async Task should_create_an_alert_with_the_correct_dismisser_role_when_the_witness_is_dismissed(Role dismisserRole, string appRole)
        {
            var dismisser = TestConferenceDto.Participants.First(x => x.Role == dismisserRole);
            var participant = TestConferenceDto.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(dismisser.Username)
                .WithRole(appRole).Build();
            var Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{participant.HearingRole} dismissed by {dismisser.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, participant.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();


            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddTaskAsync(TestConferenceDto.Id,
                It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant)),
                Times.Once);
        }

        [Test]
        public async Task should_return_accepted_when_participant_is_a_room()
        {
            var judge = TestConferenceDto.GetJudge();
            var room = TestConferenceDto.CivilianRooms[0];
            var participant = TestConferenceDto.Participants.First(x => x.IsWitness() && room.Participants.Contains(x.Id));
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            var Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{participant.HearingRole} dismissed by {judge.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, participant.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConferenceDto.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == participant.Id && r.TransferType == TransferType.Dismiss)), Times.Once);

            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddTaskAsync(TestConferenceDto.Id,
                    It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant)),
                Times.Once);
        }

        [Test]
        public async Task should_return_video_api_error_for_add_task()
        {
            var judge = TestConferenceDto.GetJudge();
            var witness = TestConferenceDto.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var responseMessage = "Could not add dismiss alert for participant";
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                responseMessage, null, default, null);

            _mocker.Mock<IVideoApiClient>().Setup(
                x => x.AddTaskAsync(TestConferenceDto.Id,
                    It.IsAny<AddTaskRequest>())).ThrowsAsync(apiException);

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, witness.Id);
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
            var judge = TestConferenceDto.GetJudge();
            var quickLinkUser = TestConferenceDto.Participants.First(x => x.Role == role);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConferenceDto.Id, quickLinkUser.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConferenceDto.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == quickLinkUser.Id && r.TransferType == TransferType.Dismiss)), Times.Once);
        }
    }
}
