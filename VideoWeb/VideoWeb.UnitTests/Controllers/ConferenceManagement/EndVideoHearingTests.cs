using System.Linq;
using System.Net;
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
    public class EndVideoHearingTests : ConferenceManagementControllerTestBase
    {
        [SetUp]
        public void Setup()
        {
            TestConferenceDto = BuildConferenceForTest();
        }
        
        [Test]
        public async Task should_return_unauthorised_if_user_not_judge()
        {
            var participant = TestConferenceDto.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.CitizenRole).Build();

            var Controller = SetupControllerWithClaims(user);

            var result = await Controller.EndVideoHearingAsync(TestConferenceDto.Id);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();

            _mocker.Mock<IVideoApiClient>().Verify(x => x.EndVideoHearingAsync(TestConferenceDto.Id), Times.Never);
        }

        [Test]
        public async Task should_return_unauthorised_if_judge_not_assigned_to_conference()
        {
            var user = new ClaimsPrincipalBuilder()
                .WithUsername("notforconference@hmcts.net")
                .WithRole(AppRoles.JudgeRole).Build();

            var Controller = SetupControllerWithClaims(user);
            
            var result = await Controller.EndVideoHearingAsync(TestConferenceDto.Id);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();
            
            _mocker.Mock<IVideoApiClient>().Verify(x => x.EndVideoHearingAsync(TestConferenceDto.Id), Times.Never);
        }

        [Test]
        public async Task should_return_video_api_error()
        {
            var participant = TestConferenceDto.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            
            var Controller = SetupControllerWithClaims(user);
            
            var responseMessage = "Could not pause a video hearing";
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int) HttpStatusCode.InternalServerError,
                responseMessage, null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.EndVideoHearingAsync(TestConferenceDto.Id))
                .ThrowsAsync(apiException);
            
            var result = await Controller.EndVideoHearingAsync(TestConferenceDto.Id);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be(responseMessage);
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        }

        [Test]
        public async Task should_return_accepted_when_user_is_judge_in_conference()
        {
            var participant = TestConferenceDto.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(AppRoles.JudgeRole).Build();
            
            var Controller = SetupControllerWithClaims(user);
            
            var result = await Controller.EndVideoHearingAsync(TestConferenceDto.Id);
            var typedResult = (AcceptedResult) result;
            typedResult.Should().NotBeNull();
            
            _mocker.Mock<IVideoApiClient>().Verify(x => x.EndVideoHearingAsync(TestConferenceDto.Id), Times.Once);
        }
    }
}
