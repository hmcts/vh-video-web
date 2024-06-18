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
using VideoWeb.Common;
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
        private VideoWeb.Controllers.InternalEventController _controller;
        private Guid _testConferenceId;
        Mock<Conference> _mockConference;


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

            new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantDtoForResponseMapper>()
                .AddTypedParameters<ParticipantForHostResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantResponseForUserMapper>()
                .Build();
            
            _controller = _mocker.Create<VideoWeb.Controllers.InternalEventController>();
            _controller.ControllerContext = context;
            _testConferenceId = Guid.NewGuid();
            _mockConference = _mocker.Mock<Conference>();
            _mockConference.Object.Id = _testConferenceId;
    
            _mocker.Mock<IConferenceService>()
                .Setup(x => x.GetConference(It.Is<Guid>(id => id == _testConferenceId)))
                .ReturnsAsync(_mockConference.Object);
            
            _mocker.Mock<IConferenceService>()
                .Setup(x => x.ConferenceCache)
                .Returns(_mocker.Mock<IConferenceCache>().Object);
            
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
            var result = await _controller.ParticipantsUpdated(_testConferenceId, updateParticipantsRequest);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IParticipantsUpdatedEventNotifier>().Verify(x 
                => x.PushParticipantsUpdatedEvent(_mockConference.Object, _mockConference.Object.Participants), Times.Once);
        }
    }
}
