using System;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Handlers.Core;

namespace VideoWeb.UnitTests.EventHandlers
{
    public class EventHandlerFactoryTests : EventHandlerTestBase
    {
        [TestCase(EventType.Pause, typeof(PauseEventHandler))]
        [TestCase(EventType.Joined, typeof(JoinedEventHandler))]
        [TestCase(EventType.Close, typeof(CloseEventHandler))]
        [TestCase(EventType.Disconnected, typeof(DisconnectedEventHandler))]
        [TestCase(EventType.Help, typeof(HelpEventHandler))]
        [TestCase(EventType.Leave, typeof(LeaveEventHandler))]
        [TestCase(EventType.Transfer, typeof(TransferEventHandler))]
        [TestCase(EventType.ParticipantJoining, typeof(ParticipantJoiningEventHandler))]
        [TestCase(EventType.VhoCall, typeof(VhOfficerCallEventHandler))]
        [TestCase(EventType.JudgeAvailable, typeof(JudgeAvailableEventHandler))]
        [TestCase(EventType.JudgeUnavailable, typeof(JudgeUnavailableEventHandler))]
        public void Should_return_instance_of_event_handler_when_factory_get_is_called_with_valid_request(
            EventType eventType, Type typeOfEventHandler)
        {
            var eventHandlerFactory = new EventHandlerFactory(EventHandlersList);

            var eventHandler = eventHandlerFactory.Get(eventType);
            eventHandler.Should().BeOfType(typeOfEventHandler);
        }

        [Test]
        public void Should_throw_exception_when_event_type_is_not_supported()
        {
            var eventHandlerFactory = new EventHandlerFactory(EventHandlersList);

            Action action = () => eventHandlerFactory.Get(EventType.None);
            action.Should().Throw<ArgumentOutOfRangeException>();
        }
    }
}