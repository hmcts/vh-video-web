using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public class PauseVideoHearingTests : ConferenceManagementControllerTestBase
    {
        [SetUp]
        public void Setup()
        {
            TestConference = BuildConferenceForTest();
        }
        
        [Test]
        public async Task should_return_unauthorised_if_user_not_judge()
        {
            var participant = TestConference.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.CitizenRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.PauseVideoHearingAsync(TestConference.Id, CancellationToken.None);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(x => x.PauseVideoHearingAsync(TestConference.Id), Times.Never);
        }

        [Test]
        public async Task should_return_unauthorised_if_judge_not_assigned_to_conference()
        {
            var user = new ClaimsPrincipalBuilder()
                .WithUsername("notforconference@hmcts.net")
                .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);
            
            var result = await Controller.PauseVideoHearingAsync(TestConference.Id, CancellationToken.None);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();
            
            _mocker.Mock<IVideoApiClient>().Verify(x => x.PauseVideoHearingAsync(TestConference.Id), Times.Never);
        }

        [Test]
        public async Task should_return_accepted_when_user_is_judge_in_conference()
        {
            var participant = TestConference.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            
            var Controller = SetupControllerWithClaims(user);
            
            var result = await Controller.PauseVideoHearingAsync(TestConference.Id, CancellationToken.None);
            var typedResult = (AcceptedResult) result;
            typedResult.Should().NotBeNull();
            
            _mocker.Mock<IVideoApiClient>().Verify(x => x.PauseVideoHearingAsync(TestConference.Id, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
