using Autofac.Extras.Moq;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;

namespace VideoWeb.UnitTests.Helpers
{
    public class NewConferenceAddedEventNotifierTests
    {
        private NewConferenceAddedEventNotifier _notifier;
        private AutoMock _mocker;
        private Conference _conference;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _notifier = _mocker.Create<NewConferenceAddedEventNotifier>();

            _conference = new Conference();
            _conference.Id = Guid.NewGuid();
        }

        [Test]
        public async Task Sends_New_Conference_Added_Event()
        {
            var conferenceId = Guid.NewGuid();
            _mocker.Mock<IEventHandlerFactory>()
            .Setup(x => x.Get(It.Is<EventType>(eventType => eventType == EventType.NewConferenceAdded)))
            .Returns(_mocker.Mock<IEventHandler>().Object);

            await _notifier.PushNewConferenceAddedEvent(conferenceId);

            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == EventType.NewConferenceAdded && c.ConferenceId == conferenceId)), Times.Once);
        }
    }
}
