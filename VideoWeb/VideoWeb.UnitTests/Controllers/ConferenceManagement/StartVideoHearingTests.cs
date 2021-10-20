using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class StartVideoHearingTests : ConferenceManagementControllerTestBase
    {
        [SetUp]
        public void Setup()
        {
            TestConference = BuildConferenceForTest();
        }

        [Test]
        public async Task Should_return_unauthorised_if_user_not_judge()
        {
            var participant = TestConference.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.CitizenRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.StartOrResumeVideoHearingAsync(TestConference.Id,
                new StartHearingRequest {Layout = HearingLayout.Dynamic});
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.StartOrResumeVideoHearingAsync(TestConference.Id,
                    It.Is<StartHearingRequest>(r => r.Layout == HearingLayout.Dynamic)), Times.Never);
        }

        [TestCase(AppRoles.JudgeRole)]
        [TestCase(AppRoles.StaffMember)]
        public async Task Should_return_unauthorised_if_host_not_assigned_to_conference(string role)
        {
            var user = new ClaimsPrincipalBuilder()
                .WithUsername("notforconference@hmcts.net")
                .WithRole(role).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.StartOrResumeVideoHearingAsync(TestConference.Id,
                new StartHearingRequest {Layout = HearingLayout.Dynamic});
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.StartOrResumeVideoHearingAsync(TestConference.Id, It.IsAny<StartHearingRequest>()), Times.Never);
        }

        [Test]
        public async Task Should_return_video_api_error()
        {
            var participant = TestConference.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var responseMessage = "Could not start a video hearing";
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                responseMessage, null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.StartOrResumeVideoHearingAsync(TestConference.Id, It.IsAny<StartHearingRequest>()))
                .ThrowsAsync(apiException);

            var result = await Controller.StartOrResumeVideoHearingAsync(TestConference.Id,
                new StartHearingRequest {Layout = HearingLayout.Dynamic});
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be(responseMessage);
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        }

        [TestCase(AppRoles.JudgeRole)]
        [TestCase(AppRoles.StaffMember)]
        public async Task Should_return_accepted_when_user_is_host_in_conference(string role)
        {
            var participant = TestConference.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(role).Build();

            var controller = SetupControllerWithClaims(user);

            var result = await controller.StartOrResumeVideoHearingAsync(TestConference.Id,
                new StartHearingRequest {Layout = HearingLayout.Dynamic});
            var typedResult = (AcceptedResult) result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(x => x.StartOrResumeVideoHearingAsync(TestConference.Id,
                It.Is<StartHearingRequest>(r => r.Layout == HearingLayout.Dynamic)), Times.Once);
        }
        
        [TestCase(AppRoles.JudgeRole)]
        [TestCase(AppRoles.StaffMember)]
        public async Task Should_send_all_Hosts_in_conference_as_participants_to_transfer(string role)
        {
            var participant = TestConference.GetJudge();
           
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(role).Build();

            var expectedParticipantsToForceTransfer = TestConference.Participants
               .Where(x => x.Username.Equals(user.Identity?.Name)).Select(x => x.Id.ToString());

            var expectedParticipantsToNotForceTransfer = TestConference.Participants
                .Where(x => x.Role.ToString() != role).Select(x => x.Id.ToString());

            // ConferenceCache is mocked in the base class for these tests...

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.StartOrResumeVideoHearingAsync(TestConference.Id,
                new StartHearingRequest {Layout = HearingLayout.Dynamic});
            var typedResult = (AcceptedResult) result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(x => x.StartOrResumeVideoHearingAsync(TestConference.Id,
                It.Is<StartHearingRequest>(r => r.Layout == HearingLayout.Dynamic && r.ParticipantsToForceTransfer.SequenceEqual(expectedParticipantsToForceTransfer) && r.MuteGuests == true)), Times.Once);
            _mocker.Mock<IVideoApiClient>().Verify(x => x.StartOrResumeVideoHearingAsync(TestConference.Id,
                It.Is<StartHearingRequest>(r => r.Layout == HearingLayout.Dynamic && r.ParticipantsToForceTransfer.SequenceEqual(expectedParticipantsToNotForceTransfer) && r.MuteGuests == true)), Times.Never);
        }
    }
}
