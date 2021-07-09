using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using Endpoint = VideoWeb.Common.Models.Endpoint;

namespace VideoWeb.UnitTests.Controllers.InternalEventControllerTests
{
    public class ParticipantsAddedTests
    {
        private AutoMock _mocker;
        protected InternalEventController _controller;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole("Judge").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantResponseMapper>()
                .AddTypedParameters<EndpointsResponseMapper>()
                .AddTypedParameters<ParticipantForJudgeResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .Build();


            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<UpdateConferenceParticipantsRequest, ParticipantsUpdated>()).Returns(_mocker.Create<ParticipantsUpdatedMapper>(parameters));

            _controller = _mocker.Create<InternalEventController>();
            _controller.ControllerContext = context;
        }


        [Test]
        public async Task Should_send_event_for_each_participant_added()
        {
            var testConferenceId = Guid.NewGuid();
            var existingParticipantId = Guid.NewGuid();

            Conference conference = new Conference();
            conference.Id = testConferenceId;
            conference.Participants.Add(new Participant()
            {
                Id = existingParticipantId,
                Username = ClaimsPrincipalBuilder.Username
            });

            _mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(id => id == testConferenceId),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);

            _mocker.Mock<IEventHandlerFactory>()
                .Setup(x => x.Get(It.Is<EventType>(eventType => eventType == EventType.ParticipantsUpdated)))
                .Returns(_mocker.Mock<IEventHandler>().Object);


            var participantAdded1 = new ParticipantRequest()
            {
                Name = "ParticipantAdded1",
            };

            var participantAdded2 = new ParticipantRequest()
            {
                Name = "ParticipantAdded2",
            };

            var participantsAdded = new List<ParticipantRequest>
            {
                participantAdded1,
                participantAdded2,
            };

            var updateParticipantsRequest = new UpdateConferenceParticipantsRequest()
            {
                NewParticipants = participantsAdded,
            };

            var result = await _controller.ParticipantsUpdated(conference.Id, updateParticipantsRequest);
            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == EventType.ParticipantsUpdated && c.ConferenceId == testConferenceId)), Times.Exactly(participantsAdded.Count));
        }
    }
}
