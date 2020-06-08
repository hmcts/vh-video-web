using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Hub
{
    public class DisconnectionTests : EventHubBaseTests
    {
        [Test]
        public async Task Should_unsubscribe_admin_from_all_conferences()
        {
            var numOfConferences = 10;
            var conferences = SetupAdminConferences(numOfConferences);
            var conferenceIds = conferences.Select(c => c.Id.ToString()).ToArray();

            await Hub.OnDisconnectedAsync(null);

            GroupManagerMock.Verify(
                x => x.RemoveFromGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferences));
        }
        
        [Test]
        public async Task Should_not_unsubscribe_judge_from_conference_channels()
        {
            const int numOfConferences = 10;
            const int numOfConferencesWithUser = 2;
            var conferenceIds = SetupJudgeConferences(numOfConferences, numOfConferencesWithUser);

            await Hub.OnDisconnectedAsync(null);

            GroupManagerMock.Verify(
                x => x.RemoveFromGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Never);
        }

        [Test]
        public async Task Should_log_critical_when_exception_on_disconnect()
        {
            var exception = new InconclusiveException("Some test");
            await Hub.OnDisconnectedAsync(exception);

            LoggerMock.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((o, t) => o.ToString().StartsWith("There was an error when disconnecting from chat hub server-side")),
                    exception,
                    (Func<It.IsAnyType, Exception, string>) It.IsAny<object>()),
                Times.Once);
        }
        
        [Test]
        public async Task Should_unsubscribe_user_from_own_user_group()
        {
            const int numOfConferences = 10;
            const int numOfConferencesWithUser = 2;
            SetupJudgeConferences(numOfConferences, numOfConferencesWithUser);

            await Hub.OnDisconnectedAsync(null);

            GroupManagerMock.Verify(
                x => x.RemoveFromGroupAsync(HubCallerContextMock.Object.ConnectionId,
                    Claims.Identity.Name, CancellationToken.None),
                Times.Once);
        }
    }
}
