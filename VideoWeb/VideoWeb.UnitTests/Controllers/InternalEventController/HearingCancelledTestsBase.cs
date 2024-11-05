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
    public class HearingCancelledTestsBase : InternalEventControllerTestsBase<VideoWeb.Controllers.InternalEventControllers.InternalEventController>
    {
        private Conference _conference;
        private Mock<IConferenceService> _conferenceServiceMock;
        private Mock<IHearingCancelledEventNotifier> _notifierMock;
        
        [SetUp]
        public void Setup()
        {
            _conference = new ConferenceCacheModelBuilder().Build();
            _conferenceServiceMock = Mocker.Mock<IConferenceService>();
            _conferenceServiceMock
                .Setup(x => x.GetConference(It.Is<Guid>(id => id == _conference.Id), It.IsAny<CancellationToken>()))
                .ReturnsAsync(_conference);
            _notifierMock = Mocker.Mock<IHearingCancelledEventNotifier>();
        }
        
        [Test]
        public async Task should_push_event()
        {
            // Arrange & Act
            var result = await Controller.HearingCancelled(_conference.Id);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            
            _conferenceServiceMock.Verify(x => x.RemoveConference(_conference, default), Times.Once);
            _notifierMock.Verify(x => x.PushHearingCancelledEvent(_conference), Times.Once);
        }
    }
}
