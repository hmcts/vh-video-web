using Autofac.Extras.Moq;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Helpers
{
    public class NewConferenceAddedEventNotifierTests
    {
        private NewConferenceAddedEventNotifier _notifier;
        private Conference _conference;
        private EventComponentHelper _eventHelper;

        [SetUp]
        public void SetUp()
        {
            _conference = new ConferenceCacheModelBuilder().Build();
            _eventHelper = new EventComponentHelper
            {
                EventHubContextMock = new Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>(),
                EventHubClientMock = new Mock<IEventHubClient>()
            };
            // this will register all participants as connected to the hub
            _eventHelper.RegisterUsersForHubContext(_conference.Participants);

            _notifier = new NewConferenceAddedEventNotifier(_eventHelper.EventHubContextMock.Object);
        }

        [Test]
        public async Task Sends_New_Conference_Added_Event()
        {
            // arrange / act
            await _notifier.PushNewConferenceAddedEvent(_conference);
            
            // assert
            const int staffMemberCount = 1;
            const int vhoOfficerGroupCount = 1;
            _eventHelper.EventHubClientMock.Verify(x => x.NewConferenceAddedMessage(_conference.Id),
                Times.Exactly(_conference.Participants.Count + staffMemberCount + vhoOfficerGroupCount));
        }
    }
}
