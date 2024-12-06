using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Hub
{
    public class ConnectionTests : EventHubBaseTests
    {
        [Test]
        public async Task Should_subscribe_admin_to_all_conferences()
        {
            var numOfConferences = 10;
            var conferences = SetupConferences(numOfConferences);
            var conferenceIds = conferences.Select(c => c.Id.ToString()).ToArray();

            await HubVih11189.OnConnectedAsync();
            
            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferences));
        }
        
        [Test]
        public async Task Should_subscribe_admin_to_vho_group()
        {
            var numOfConferences = 10;
            SetupConferences(numOfConferences);

            await HubVih11189.OnConnectedAsync();

            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId,
                    EventHub.Hub.EventHubVIH11189.VhOfficersGroupName, CancellationToken.None),
                Times.Once);
        }
        
        [Test]
        public async Task Should_subscribe_staff_member_to_all_conferences()
        {
            var numOfConferences = 10;
            var conferences = SetupConferences(numOfConferences, userRole: AppRoles.StaffMember);
            var conferenceIds = conferences.Select(c => c.Id.ToString()).ToArray();

            await HubVih11189.OnConnectedAsync();
            
            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Exactly(numOfConferences));
        }

        [Test]
        public async Task Should_subscribe_staff_member_to_staff_member_group()
        {
            var numOfConferences = 10;
            SetupConferences(numOfConferences, userRole: AppRoles.StaffMember);

            await HubVih11189.OnConnectedAsync();

            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId,
                    EventHub.Hub.EventHubVIH11189.StaffMembersGroupName, CancellationToken.None),
                Times.Once);
        }
        
        [Test]
        public async Task Should_not_subscriber_judge_to_conference_channels()
        {
            const int numOfConferences = 10;
            const int numOfConferencesWithUser = 2;
            var conferenceIds = SetupJudgeConferences(numOfConferences, numOfConferencesWithUser);
            
            await HubVih11189.OnConnectedAsync();
            
            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsIn(conferenceIds),
                    CancellationToken.None), Times.Never);
        }

        [Test]
        public async Task Should_subscribe_user_to_own_user_group()
        {
            const int numOfConferences = 10;
            const int numOfConferencesWithUser = 2;
            SetupJudgeConferences(numOfConferences, numOfConferencesWithUser);

            await HubVih11189.OnConnectedAsync();

            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId,
                    Claims.Identity.Name, CancellationToken.None),
                Times.Once);
        }
    }
}
