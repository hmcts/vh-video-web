using System;
using System.Linq;
using System.Net;
using System.Threading;
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

            var Controller = SetupControllerWithClaims(user);

            foreach (var participant in invalidParticipants)
            {
                var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id, CancellationToken.None);
                var typedResult = (UnauthorizedObjectResult)result;
                typedResult.Should().NotBeNull();
                typedResult.Value.Should().Be("Participant/Endpoint is not callable");

                _mocker.Mock<IVideoApiClient>().Verify(
                    x => x.TransferParticipantAsync(TestConference.Id,
                        It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
                
                _mocker.Mock<IConferenceManagementService>().Verify(
                    x => x.UpdateParticipantHandStatusInConference(TestConference.Id, participant.Id, false, It.IsAny<CancellationToken>()), Times.Never);
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

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, Guid.NewGuid(), CancellationToken.None);
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("Participant/Endpoint is not callable");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
            
            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.UpdateParticipantHandStatusInConference(TestConference.Id, participant.Id, false, It.IsAny<CancellationToken>()), Times.Never);
        }

        [Test]
        public async Task should_return_unauthorised_if_not_judge_conference()
        {
            var participant = TestConference.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.CitizenRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id, CancellationToken.None);
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);

            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.UpdateParticipantHandStatusInConference(TestConference.Id, participant.Id, false, It.IsAny<CancellationToken>()), Times.Never);
        }

        [Test]
        public async Task should_return_accepted_when_participant_is_witness_and_judge_is_in_conference()
        {
            var judge = TestConference.GetJudge();
            var witness = TestConference.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, witness.Id, CancellationToken.None);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == witness.Id && r.TransferType == TransferType.Dismiss), It.IsAny<CancellationToken>()), Times.Once);
            
            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.UpdateParticipantHandStatusInConference(TestConference.Id, witness.Id, false, It.IsAny<CancellationToken>()), Times.Once);
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
            var Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{expectedPrefix} dismissed by {judge.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id, CancellationToken.None);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();


            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddTaskAsync(TestConference.Id,
                It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant), It.IsAny<CancellationToken>()),
                Times.Once);
            
            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.UpdateParticipantHandStatusInConference(TestConference.Id, participant.Id, false, It.IsAny<CancellationToken>()), Times.Once);
        }

        [Test]
        public async Task should_create_an_alert_when_the_witness_is_dismissed()
        {

            var judge = TestConference.GetJudge();
            var participant = TestConference.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            var Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{participant.HearingRole} dismissed by {judge.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id, CancellationToken.None);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();


            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddTaskAsync(TestConference.Id,
                It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant), It.IsAny<CancellationToken>()),
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
            var Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{participant.HearingRole} dismissed by {dismisser.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id, CancellationToken.None);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();


            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddTaskAsync(TestConference.Id,
                It.Is<AddTaskRequest>(r =>
                    r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Test]
        public async Task should_return_accepted_when_participant_is_a_room()
        {
            var judge = TestConference.GetJudge();
            var room = TestConference.CivilianRooms[0];
            var participant = TestConference.Participants.First(x => x.IsWitness() && room.Participants.Contains(x.Id));
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            var Controller = SetupControllerWithClaims(user);

            string expectedBody = $"{participant.HearingRole} dismissed by {judge.HearingRole}";

            var result = await Controller.DismissParticipantAsync(TestConference.Id, participant.Id, CancellationToken.None);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == participant.Id && r.TransferType == TransferType.Dismiss), It.IsAny<CancellationToken>()), Times.Once);

            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddTaskAsync(TestConference.Id,
                    It.Is<AddTaskRequest>(r => r.ParticipantId == participant.Id && r.Body == expectedBody && r.TaskType == TaskType.Participant), It.IsAny<CancellationToken>()),
                Times.Once);
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

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissParticipantAsync(TestConference.Id, quickLinkUser.Id, CancellationToken.None);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == quickLinkUser.Id && r.TransferType == TransferType.Dismiss), It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
