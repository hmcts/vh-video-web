using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Services;
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

            var controller = SetupControllerWithClaims(user);

            var result = await controller.StartOrResumeVideoHearingAsync(TestConference.Id,
                new StartOrResumeVideoHearingRequest() {Layout = HearingLayout.Dynamic}, CancellationToken.None);
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

            var controller = SetupControllerWithClaims(user);

            var result = await controller.StartOrResumeVideoHearingAsync(TestConference.Id,
                new StartOrResumeVideoHearingRequest {Layout = HearingLayout.Dynamic}, CancellationToken.None);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be("User must be either Judge or StaffMember.");

            _mocker.Mock<IVideoApiClient>().Verify(
                x => x.StartOrResumeVideoHearingAsync(TestConference.Id, It.IsAny<StartHearingRequest>()), Times.Never);
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
                new StartOrResumeVideoHearingRequest { Layout = HearingLayout.Dynamic }, CancellationToken.None);
            
            var typedResult = (AcceptedResult) result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IConferenceManagementService>().Verify(
                x => x.StartOrResumeVideoHearingAsync(TestConference.Id, participant.Username, HearingLayout.Dynamic,
                    CancellationToken.None), Times.Once);
        }
    }
}
