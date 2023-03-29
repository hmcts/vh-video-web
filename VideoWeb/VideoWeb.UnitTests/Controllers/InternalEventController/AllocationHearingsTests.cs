using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.InternalHandlers.Core;
using VideoWeb.EventHub.InternalHandlers.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class AllocationHearingsTests
    {
        private AutoMock _mocker;
        private VideoWeb.Controllers.InternalEventController _controller;

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
                .AddTypedParameters<ConferenceMapper>()
                .AddTypedParameters<EndpointsResponseMapper>()
                .AddTypedParameters<ParticipantDetailsResponseMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, Conference>())
                .Returns(_mocker.Create<ConferenceMapper>(parameters));
            _mocker.Mock<IInternalEventHandlerFactory>().Setup(x => x.Get(It.IsAny<AllocationUpdatedEventDto>()))
                .Returns(new Mock<IInternalEventHandler<AllocationUpdatedEventDto>>().Object);

            _controller = _mocker.Create<VideoWeb.Controllers.InternalEventController>();
            _controller.ControllerContext = context;
        }


        [Test]
        public async Task Should_send_event()
        {
            // Arrange
            var allocationHearingsToCsoRequest = new AllocationUpdatedRequest()
            {
                Conferences = new List<ConferenceDetailsResponse>()
                {
                    ConferenceDetailsResponseBuilder.CreateValidConferenceResponse(),
                    ConferenceDetailsResponseBuilder.CreateValidConferenceResponse(),
                    ConferenceDetailsResponseBuilder.CreateValidConferenceResponse()
                },
                AllocatedCsoUsername = "csousername@email.com"
            };
            
            // Act
            var result = await _controller.AllocationUpdated(allocationHearingsToCsoRequest);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            _mocker.Mock<IInternalEventHandlerFactory>().Verify(
                x => x.Get(It.Is<AllocationUpdatedEventDto>(dto =>
                    dto.CsoUsername == allocationHearingsToCsoRequest.AllocatedCsoUsername &&
                    dto.Conferences.Count == allocationHearingsToCsoRequest.Conferences.Count)), Times.Once);
            // _mocker.Mock<IAllocationUpdatedEventNotifier>().Verify(x => x.PushAllocationUpdatedEvent(allocationHearingsToCsoRequest.AllocatedCsoUsername, It.IsAny<List<Conference>>()), Times.Once);
        }
    }
}
