using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;
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
        public async Task should_return_unauthorised_if_user_not_judge()
        {
            var participant = TestConference.Participants.First(x => x.Role == Role.Individual);
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(participant.Role).Build();

            Controller = SetupControllerWithClaims(user);

            var result = await Controller.StartOrResumeVideoHearingAsync(TestConference.Id);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();

            VideoApiClientMock.Verify(x => x.StartOrResumeVideoHearingAsync(TestConference.Id), Times.Never);
        }

        [Test]
        public async Task should_return_unauthorised_if_judge_not_assigned_to_conference()
        {
            var user = new ClaimsPrincipalBuilder()
                .WithUsername("notforconference@test.com")
                .WithRole(Role.Judge).Build();

            Controller = SetupControllerWithClaims(user);
            
            var result = await Controller.StartOrResumeVideoHearingAsync(TestConference.Id);
            var typedResult = (UnauthorizedObjectResult) result;
            typedResult.Should().NotBeNull();
            
            VideoApiClientMock.Verify(x => x.StartOrResumeVideoHearingAsync(TestConference.Id), Times.Never);
        }

        [Test]
        public async Task should_return_video_api_error()
        {
            var participant = TestConference.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(participant.Role).Build();
            
            Controller = SetupControllerWithClaims(user);
            
            var responseMessage = "Could not start a video hearing";
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int) HttpStatusCode.InternalServerError,
                responseMessage, null, default, null);
            VideoApiClientMock
                .Setup(x => x.StartOrResumeVideoHearingAsync(TestConference.Id))
                .ThrowsAsync(apiException);
            
            var result = await Controller.StartOrResumeVideoHearingAsync(TestConference.Id);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().Be(responseMessage);
            typedResult.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        }

        [Test]
        public async Task should_return_accepted_when_user_is_judge_in_conference()
        {
            var participant = TestConference.GetJudge();
            var user = new ClaimsPrincipalBuilder()
                .WithUsername(participant.Username)
                .WithRole(participant.Role).Build();
            
            Controller = SetupControllerWithClaims(user);
            
            var result = await Controller.StartOrResumeVideoHearingAsync(TestConference.Id);
            var typedResult = (AcceptedResult) result;
            typedResult.Should().NotBeNull();
            
            VideoApiClientMock.Verify(x => x.StartOrResumeVideoHearingAsync(TestConference.Id), Times.Once);
        }
    }
}
