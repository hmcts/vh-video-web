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
    public class HearingDetailsUpdatedEventNotifierTests
    {
        private HearingDetailsUpdatedEventNotifier _notifier;
        private AutoMock _mocker;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _notifier = _mocker.Create<HearingDetailsUpdatedEventNotifier>();
        }

        [Test]
        public async Task should_push_event()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            _mocker.Mock<IEventHandlerFactory>()
                .Setup(x => x.Get(It.Is<EventType>(eventType => eventType == EventType.HearingDetailsUpdated)))
                .Returns(_mocker.Mock<IEventHandler>().Object);

            // Act
            await _notifier.PushHearingDetailsUpdatedEvent(conferenceId);

            // Assert
            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => 
                c.EventType == EventType.HearingDetailsUpdated && 
                c.ConferenceId == conferenceId)
            ), Times.Once);
        }
    }
}
