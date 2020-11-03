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

namespace VideoWeb.UnitTests.Controllers.MediaEventController
{
    public class MediaEventBaseTestSetup
    {
        private VideoWeb.Controllers.InternalEventController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IConferenceCache> _conferenceCacheMock;
        private Conference _testConference;
        private Participant _testParticipant;

        public void InitSetup()
        {
            _conferenceCacheMock = new Mock<IConferenceCache>();
            _videoApiClientMock = new Mock<IVideoApiClient>();

            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();

            _testConference = new EventComponentHelper().BuildConferenceForTest();
            _testParticipant = _testConference.Participants.First(x => !x.IsJudge());
            _testParticipant.Username = ClaimsPrincipalBuilder.Username;

            _conferenceCacheMock
                .Setup(x => x.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller =
                new VideoWeb.Controllers.InternalEventController(_videoApiClientMock.Object, _conferenceCacheMock.Object)
                {
                    ControllerContext = context
                };
        }
    }
}
