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
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.InternalHandlers.Core;
using VideoWeb.EventHub.InternalHandlers.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class ParticipantsUpdatedTests
    {
        private AutoMock _mocker;
        private VideoWeb.Controllers.InternalEventController _controller;
        private Conference _conference;

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
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .AddTypedParameters<LinkedParticipantToLinkedParticipantResponseMapper>()
                .AddTypedParameters<CivilianRoomToRoomSummaryResponseMapper>()
                .Build();


            _controller = _mocker.Create<VideoWeb.Controllers.InternalEventController>();
            _controller.ControllerContext = context;

            _conference = new ConferenceCacheModelBuilder().Build();

            _mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(id => id == _conference.Id),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(_conference);

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantRequest, IEnumerable<Participant>, Participant>()).Returns(_mocker.Create<ParticipantRequestMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<UpdateParticipantRequest, IEnumerable<Participant>, UpdateParticipant>()).Returns(_mocker.Create<UpdateParticipantRequestToUpdateParticipantMapper>(parameters));
            
            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<CivilianRoom, RoomSummaryResponse>())
                .Returns(_mocker.Create<CivilianRoomToRoomSummaryResponseMapper>(parameters));
            
            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<LinkedParticipant, LinkedParticipantResponse>())
                .Returns(_mocker.Create<LinkedParticipantToLinkedParticipantResponseMapper>(parameters));
            
            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<Participant, Conference, ParticipantResponse>())
                .Returns(_mocker.Create<ParticipantToParticipantResponseMapper>(parameters));
            
            
            
            _mocker.Mock<IInternalEventHandlerFactory>().Setup(x => x.Get(It.IsAny<ParticipantsUpdatedEventDto>()))
                .Returns(new Mock<IInternalEventHandler<ParticipantsUpdatedEventDto>>().Object);
            
        }


        [Test]
        public async Task Should_send_event()
        {
            // Arrange
            var updateParticipantsRequest = new UpdateConferenceParticipantsRequest();

            // Act
            var result = await _controller.ParticipantsUpdated(_conference.Id, updateParticipantsRequest);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IInternalEventHandlerFactory>().Verify(x=> x.Get(It.Is<ParticipantsUpdatedEventDto>(dto => dto.ConferenceId == _conference.Id)));
            // _mocker.Mock<IParticipantsUpdatedEventNotifier>().Verify(x => x.PushParticipantsUpdatedEvent(_conference.Object, _conference.Object.Participants), Times.Once);
        }
    }
}
