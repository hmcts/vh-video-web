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
using VideoWeb.UnitTests.Builders;
using ProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;
using VideoApi.Contract.Requests;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class DismissWitnessTests : ConferenceManagementControllerTestBase
    {
        [SetUp]
        public void Setup()
        {
            TestConference = BuildConferenceForTest();
        }
        
        [Test]
        public async Task should_return_unauthorised_if_participant_is_not_a_witness()
        {
            var judge = TestConference.GetJudge();
            var participant = TestConference.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
              .WithUsername(judge.Username)
              .WithRole(AppRoles.JudgeRole).Build();

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissWitnessAsync(TestConference.Id, participant.Id);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("Participant is not a witness");

            VideoApiClientMock.Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r => r.ParticipantId == participant.Id)), Times.Never);
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

            var result = await Controller.DismissWitnessAsync(TestConference.Id, Guid.NewGuid());
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("Participant is not a witness");

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

            var result = await Controller.DismissWitnessAsync(TestConference.Id, participant.Id);
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
                (int) HttpStatusCode.InternalServerError,
                responseMessage, null, default, null);
            
            VideoApiClientMock.Setup(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.IsAny<TransferParticipantRequest>())).ThrowsAsync(apiException);

            var result = await Controller.DismissWitnessAsync(TestConference.Id,witness.Id);
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult) result;
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

            var result = await Controller.DismissWitnessAsync(TestConference.Id, witness.Id);
            var typedResult = (AcceptedResult) result;
            typedResult.Should().NotBeNull();

            VideoApiClientMock.Verify(
                x => x.TransferParticipantAsync(TestConference.Id,
                    It.Is<TransferParticipantRequest>(r =>
                        r.ParticipantId == witness.Id && r.TransferType == TransferType.Dismiss)), Times.Once);
        }

        [Test]
        public async Task should_create_an_alert_when_the_witness_is_dismissed()
        {
            var judge = TestConference.GetJudge();
            var witness = TestConference.Participants.First(x => x.HearingRole == "Witness");
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(judge.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.DismissWitnessAsync(TestConference.Id, witness.Id);
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();

            VideoApiClientMock.Verify(x => x.AddTaskAsync(TestConference.Id, 
                It.Is<AddTaskRequest>(r => r.ParticipantId == witness.Id && r.Body == "Witness dismissed" && r.TaskType == TaskType.Participant)), 
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

            var result = await Controller.DismissWitnessAsync(TestConference.Id, witness.Id);
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult)result;
            typedResult.Value.Should().Be(responseMessage);
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        }
    }
}
