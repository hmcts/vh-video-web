using System;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;

namespace VideoWeb.UnitTests.Helpers
{
    public class HearingCancelledEventNotifierTests
    {
        private HearingCancelledEventNotifier _notifier;
        private AutoMock _mocker;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _notifier = _mocker.Create<HearingCancelledEventNotifier>();
        }

        [Test]
        public async Task should_push_event()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            _mocker.Mock<IEventHandlerFactory>()
                .Setup(x => x.Get(It.Is<EventType>(eventType => eventType == EventType.HearingCancelled)))
                .Returns(_mocker.Mock<IEventHandler>().Object);

            // Act
            await _notifier.PushHearingCancelledEvent(hearingId);

            // Assert
            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => 
                c.EventType == EventType.HearingCancelled && 
                c.HearingId == hearingId)
            ), Times.Once);
        }
    }
}
