using System;
using Autofac.Extras.Moq;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;

namespace VideoWeb.UnitTests.Helpers
{
    class AllocationHearingsEventNotifierTests
    {
        private AllocationHearingsEventNotifier _notifier;
        private AutoMock _mocker;
        private IList<HearingDetailRequest> _hearings;
        private const string CsoUserName = "username@email.com";

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _notifier = _mocker.Create<AllocationHearingsEventNotifier>();

            _hearings = new List<HearingDetailRequest>();

            HearingDetailRequest hearing = new HearingDetailRequest();
            hearing.Judge = "Judge Name 1";
            hearing.Time = new DateTimeOffset(new DateTime(2023,04,01,10,00,00));
            hearing.CaseName = "Case Name";
            
            _hearings.Add(hearing);
            
        }

        [Test]
        public async Task Should_send_event()
        {
            _mocker.Mock<IEventHandlerFactory>()
                .Setup(x => x.Get(It.Is<EventType>(eventType => eventType == EventType.AllocationHearings)))
                .Returns(_mocker.Mock<IEventHandler>().Object);

            // Act
            await _notifier.PushAllocationHearingsEvent(CsoUserName, _hearings);
            

            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == EventType.AllocationHearings)), Times.Once);
        }

        [Test]
        public async Task Should_not_send_event_when_hearings_is_empty()
        {
            // arrange
            _hearings = new List<HearingDetailRequest>();

            // act
            await _notifier.PushAllocationHearingsEvent(CsoUserName, _hearings);

            // assert
            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == EventType.AllocationHearings)), Times.Never);
        }
    }
}
