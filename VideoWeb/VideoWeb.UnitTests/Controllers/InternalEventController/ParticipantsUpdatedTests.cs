using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class ParticipantsUpdatedTests
    {
        private AutoMock _mocker;
        protected VideoWeb.Controllers.InternalEventController _controller;

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
                .AddTypedParameters<ParticipantForHostResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .Build();


            _controller = _mocker.Create<VideoWeb.Controllers.InternalEventController>();
            _controller.ControllerContext = context;

            testConferenceId = Guid.NewGuid();
            existingParticipantId = Guid.NewGuid();

            mockConference = _mocker.Mock<Conference>();
            mockConference.Object.Id = testConferenceId;

            _mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(id => id == testConferenceId),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(mockConference.Object);

            _mocker.Mock<IParticipantsUpdatedEventNotifier>();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantRequest, IEnumerable<Participant>, Participant>()).Returns(_mocker.Create<ParticipantRequestMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<UpdateParticipantRequest, IEnumerable<Participant>, UpdateParticipant>()).Returns(_mocker.Create<UpdateParticipantRequestToUpdateParticipantMapper>());
            
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

            _mocker.Mock<IParticipantsUpdatedEventNotifier>().Verify(x => x.PushParticipantsUpdatedEvent(mockConference.Object, mockConference.Object.Participants), Times.Once);
        }
    }
}
