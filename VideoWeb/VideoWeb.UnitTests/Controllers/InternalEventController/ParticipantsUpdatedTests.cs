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
    public class ParticipantsUpdatedTests
    {
        private AutoMock _mocker;
        protected InternalEventController _controller;

        private Guid testConferenceId;
        private Guid existingParticipantId;

        Mock<Conference> mockConference;


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


            _controller = _mocker.Create<InternalEventController>();
            _controller.ControllerContext = context;

            testConferenceId = Guid.NewGuid();
            existingParticipantId = Guid.NewGuid();

            mockConference = _mocker.Mock<Conference>();
            mockConference.Object.Id = testConferenceId;

            _mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(id => id == testConferenceId),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(mockConference.Object);

            _mocker.Mock<IEventHandlerFactory>()
                .Setup(x => x.Get(It.Is<EventType>(eventType => eventType == EventType.ParticipantsUpdated)))
                .Returns(_mocker.Mock<IEventHandler>().Object);

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantRequest, Participant>()).Returns(_mocker.Create<ParticipantRequestMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Participant, Conference, ParticipantResponse>()).Returns(_mocker.Create<ParticipantToParticipantResponseMapper>());
        }


        [Test]
        public async Task Should_send_event()
        {
            // Arrange
            var updateParticipantsRequest = new UpdateConferenceParticipantsRequest();

            // Act
            var result = await _controller.ParticipantsUpdated(testConferenceId, updateParticipantsRequest);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.Is<CallbackEvent>(c => c.EventType == EventType.ParticipantsUpdated && c.ConferenceId == testConferenceId && c.Participants == c.Participants)), Times.Once);
        }
    }
}
