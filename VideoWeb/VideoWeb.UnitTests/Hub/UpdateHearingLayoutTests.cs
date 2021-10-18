using Autofac.Extras.Moq;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Hub
{
    [TestFixture]
    class UpdateHearingLayoutTests : EventHubBaseTests
    {
        private Participant _judgeUser;
        private Conference _conference;

        [SetUp]
        public void SetUp()
        {
            _conference = CreateTestConference("steve");
            _judgeUser = _conference.Participants.FirstOrDefault(x => x.Role == Role.Judge);
            ConferenceCacheMock.Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == _conference.Id), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(_conference);
        }

        [Test]
        public async Task should_call_conference_layout_service_update_layout()
        {
            // Arrange
            var layout = HearingLayout.OnePlus7;
            Claims = new ClaimsPrincipalBuilder().WithRole(AppRoles.JudgeRole).WithUsername(_judgeUser.Username).Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);

            // Act
            await Hub.UpdateHearingLayout(_conference.Id, layout);

            // Assert
            hearingLayoutServiceMock.Verify(x => x.UpdateLayout(_conference.Id, _judgeUser.Id, layout));
        }
    }
}
