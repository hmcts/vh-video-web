using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.EventHandlers
{
    class AllocationHearingsEventHandlerTests : EventHandlerTestBase
    {
        private AllocationHearingsEventHandler _eventHandler;

        [Test]
        public async Task Should_send_allocation_message_to_cso()
        {
            _eventHandler = new AllocationHearingsEventHandler(EventHubContextMock.Object, ConferenceCache,
                LoggerMock.Object, VideoApiClientMock.Object);

            var allocatedHearingsDetails = new List<HearingDetailRequest>();
            var callbackEvent = new CallbackEvent
            {
                EventType = EventType.AllocationHearings,
                CsoAllocatedUserName = "csousername@email.com",
                AllocatedHearingsDetails = allocatedHearingsDetails,
                TimeStampUtc = DateTime.UtcNow
            };

            await _eventHandler.HandleAsync(callbackEvent);

            EventHubClientMock.Verify(
                x => x.AllocationHearings("csousername@email.com", allocatedHearingsDetails), Times.Exactly(1));
        }
    }
}
