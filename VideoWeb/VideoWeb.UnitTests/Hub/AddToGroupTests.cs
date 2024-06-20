using Moq;
using NUnit.Framework;
using System;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Hub
{
    public class AddToGroupTests : EventHubBaseTests
    {

        [Test]
        public async Task Add_To_Group_Updates_Group_With_New_Conference()
        {
            Claims = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole).Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);

            var newConferenceId = Guid.NewGuid().ToString();
            await HubPps2.AddToGroup(newConferenceId);

            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, newConferenceId,
                    CancellationToken.None), Times.Once);
        }

        [Test]
        public async Task Add_To_Group_Does_Not_Update_Group_With_New_Conference_For_Non_Vho_Sender()
        {
            Claims = new ClaimsPrincipalBuilder().WithRole(AppRoles.CitizenRole).Build();
            HubCallerContextMock.Setup(x => x.User).Returns(Claims);

            await HubPps2.AddToGroup(Guid.NewGuid().ToString());

            GroupManagerMock.Verify(
                x => x.AddToGroupAsync(HubCallerContextMock.Object.ConnectionId, It.IsAny<string>(),
                    CancellationToken.None), Times.Never);
        }
    }
}
