using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class HearingCancelledTests : InternalEventControllerTests
    {
        [Test]
        public async Task should_push_event()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var notifierMock = Mocker.Mock<IHearingCancelledEventNotifier>();

            // Act
            var result = await Controller.HearingCancelled(hearingId);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            notifierMock.Verify(x => x.PushHearingCancelledEvent(hearingId), Times.Once);
        }
    }
}
