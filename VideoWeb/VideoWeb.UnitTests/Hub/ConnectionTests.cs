using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Hub
{
    public class ConnectionTests : EventHubBaseTests
    {
        [Test]
        public async Task Should_subscribe_admin_to_all_conferences()
        {
            var numOfConferences = 10;
            var conferences = SetupAdminConferences(numOfConferences);
            var conferenceIds = conferences.Select(c => c.Id.ToString()).ToArray();

            await Hub.OnConnectedAsync();
            
            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferences));
        }
        
        [Test]
        public async Task Should_subscribe_admin_to_vho_group()
        {
            var numOfConferences = 10;
            SetupAdminConferences(numOfConferences);

            await Hub.OnConnectedAsync();

            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId,
                    EventHub.Hub.EventHub.VhOfficersGroupName, CancellationToken.None),
                Times.Once);
        }
        
        [Test]
        public async Task Should_subscribe_judge_to_conferences_they_are_assigned_to()
        {
            const int numOfConferences = 10;
            const int numOfConferencesWithUser = 2;
            var conferenceIds = SetupJudgeConferences(numOfConferences, numOfConferencesWithUser);
            
            await Hub.OnConnectedAsync();
            
            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferencesWithUser));
        }

        [Test]
        public async Task Should_subscribe_user_to_own_user_group()
        {
            const int numOfConferences = 10;
            const int numOfConferencesWithUser = 2;
            SetupJudgeConferences(numOfConferences, numOfConferencesWithUser);

            await Hub.OnConnectedAsync();

            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId,
                    Claims.Identity.Name, CancellationToken.None),
                Times.Once);
        }
    }
}
