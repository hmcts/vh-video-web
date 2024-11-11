using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class HearingDetailsUpdatedTests : InternalEventControllerTestsBase<VideoWeb.Controllers.InternalEventControllers.InternalEventController>
    {
        private Conference _conference;
        private Mock<IHearingDetailsUpdatedEventNotifier> _notifierMock;
        
        [SetUp]
        public void Setup()
        {
            _conference = new ConferenceCacheModelBuilder().Build();
            Mocker.Mock<IConferenceService>()
                .Setup(x => x.ForceGetConference(It.Is<Guid>(id => id == _conference.Id), It.IsAny<CancellationToken>()))
                .ReturnsAsync(_conference);
            _notifierMock = Mocker.Mock<IHearingDetailsUpdatedEventNotifier>();
        }
        
        [Test]
        public async Task should_push_event()
        {
            // Arrange & Act
            var result = await Controller.HearingDetailsUpdated(_conference.Id);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _notifierMock.Verify(x => x.PushHearingDetailsUpdatedEvent(_conference), Times.Once);
        }
    }
}
