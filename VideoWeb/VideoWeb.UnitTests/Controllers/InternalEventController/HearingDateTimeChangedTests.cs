using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class HearingDateTimeChangedTests : InternalEventControllerTests
    {
        [Test]
        public async Task should_push_event()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var notifierMock = Mocker.Mock<IHearingDateTimeChangedEventNotifier>();

            // Act
            var result = await Controller.HearingDateTimeChanged(hearingId);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            notifierMock.Verify(x => x.PushHearingDateTimeChangedEvent(hearingId), Times.Once);
        }
    }
}
