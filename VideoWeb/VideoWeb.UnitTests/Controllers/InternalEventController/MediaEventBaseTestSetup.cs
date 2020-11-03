using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class MediaEventBaseTestSetup
    {
        protected VideoWeb.Controllers.InternalEventController Controller;
        protected Mock<IVideoApiClient> VideoApiClientMock;
        protected Mock<IConferenceCache> ConferenceCacheMock;
        protected Conference TestConference;
        protected Participant TestParticipant;

        public void InitSetup()
        {
            ConferenceCacheMock = new Mock<IConferenceCache>();
            VideoApiClientMock = new Mock<IVideoApiClient>();

            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();

            TestConference = new EventComponentHelper().BuildConferenceForTest();
            TestParticipant = TestConference.Participants.First(x => !x.IsJudge());
            TestParticipant.Username = ClaimsPrincipalBuilder.Username;

            ConferenceCacheMock
                .Setup(x => x.GetOrAddConferenceAsync(TestConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(TestConference);

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            Controller =
                new VideoWeb.Controllers.InternalEventController(VideoApiClientMock.Object, ConferenceCacheMock.Object)
                {
                    ControllerContext = context
                };
        }
    }
}
