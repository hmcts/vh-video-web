using Moq;
using NUnit.Framework;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace VideoWeb.UnitTests.Hub
{
    public class AddToGroupTests : EventHubBaseTests
    {

        [Test]
        public async Task Add_To_Group_Updates_Group_With_New_Conference()
        {
            var newConferenceId = Guid.NewGuid().ToString();
            await Hub.AddToGroup(newConferenceId);

            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, newConferenceId,
                    CancellationToken.None), Times.Once);
        }
    }
}
