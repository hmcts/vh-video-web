using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.UnitTests.Helpers
{
    class ParticipantsUpdatedEventNotifierTests
    {
        private ParticipantsUpdatedEventNotifier _notifier;
        private AutoMock _mocker;
        private Conference _conference;
        private Participant _participant1;
        private Participant _participant2;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _notifier = _mocker.Create<ParticipantsUpdatedEventNotifier>();

            _conference = new Conference();
            _conference.Id = Guid.NewGuid();
            _conference.Participants = new List<Participant>();

            _participant1 = new Participant();
            _participant1.Id = Guid.NewGuid();

            _participant2 = new Participant();
            _participant2.Id = Guid.NewGuid();

            _conference.Participants.Add(_participant1);
            _conference.Participants.Add(_participant2);
        }

        [Test]
        public async Task Should_send_event()
        {
            // Arrange
            var response1 = new ParticipantResponse();
            response1.Id = _participant1.Id;


            var response2 = new ParticipantResponse();
            response2.Id = _participant1.Id;

            var responseList = new List<ParticipantResponse> { response1, response2 };

            _mocker.Mock<IMapTo<Participant, Conference, ParticipantResponse>>().Setup(x => x.Map(_participant1, _conference)).Returns(response1);
            _mocker.Mock<IMapTo<Participant, Conference, ParticipantResponse>>().Setup(x => x.Map(_participant2, _conference)).Returns(response2);
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Participant, Conference, ParticipantResponse>()).Returns(_mocker.Mock<IMapTo<Participant, Conference, ParticipantResponse>>().Object);

            _mocker.Mock<IEventHandlerFactory>()
                .Setup(x => x.Get(It.Is<EventType>(eventType => eventType == EventType.ParticipantsUpdated)))
                .Returns(_mocker.Mock<IEventHandler>().Object);

            // Act
            await _notifier.PushParticipantsUpdatedEvent(_conference);
            

            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == EventType.ParticipantsUpdated && c.ConferenceId == _conference.Id && ParticipantResponseListsMatch(c.Participants, responseList))), Times.Once);
        }

        private bool ParticipantResponseListsMatch(List<ParticipantResponse> list1, List<ParticipantResponse> list2)
        {
            return list1.Any(x => list2.Any(y => x.Id == y.Id)) && list2.Any(x => list1.Any(y => x.Id == y.Id));
        }
    }
}
