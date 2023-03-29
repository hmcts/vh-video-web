using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.InternalHandlers;
using VideoWeb.EventHub.InternalHandlers.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.InternalEvents
{
    public class NewConferenceAddedEventHandlerTests
    {
        private NewConferenceAddedEventHandler _sut;
        private EventComponentHelper _eventComponentHelper;
        private Conference _conference;

        [SetUp]
        public void SetUp()
        {
            _eventComponentHelper = new EventComponentHelper
            {
                EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>(),
                EventHubClientMock = new Mock<IEventHubClient>()
            };
            _sut = new NewConferenceAddedEventHandler(_eventComponentHelper.EventHubContextMock.Object);
            _conference = _eventComponentHelper.BuildConferenceForTest();
            _eventComponentHelper.RegisterUsersForHubContext(_conference.Participants);
        }

        [Test]
        public async Task should_notify_vho_when_new_conference_added()
        {
            var dto = new NewConferenceAddedEventDto
            {
                ConferenceId = _conference.Id
            };

            await _sut.HandleAsync(dto);

            _eventComponentHelper.EventHubClientMock.Verify(
                x => x.NewConferenceAddedMessage(_conference.Id), Times.Once);
        }
    }
}
