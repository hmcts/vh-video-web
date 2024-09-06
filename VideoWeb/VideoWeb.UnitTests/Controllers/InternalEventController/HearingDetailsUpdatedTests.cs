using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class HearingDetailsUpdatedTests : InternalEventControllerTests
    {
        [Test]
        public async Task should_push_event()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var notifierMock = Mocker.Mock<IHearingDetailsUpdatedEventNotifier>();

            // Act
            var result = await Controller.HearingDetailsUpdated(hearingId);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            Mocker.Mock<IConferenceService>().Verify(x
                => x.ForceGetConference(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Once);
            notifierMock.Verify(x => x.PushHearingDetailsUpdatedEvent(hearingId), Times.Once);
        }
    }
}
