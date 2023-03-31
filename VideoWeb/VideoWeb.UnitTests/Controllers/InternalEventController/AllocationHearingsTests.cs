using System.Collections.Generic;
using System.Linq;
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
using VideoWeb.Controllers;
using VideoWeb.InternalEvents.Interfaces;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using VideoWeb.UnitTests.Controllers.ConferenceController;

namespace VideoWeb.UnitTests.Controllers.InternalEventControllerTests
{
    public class AllocationHearingsTests
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
                .AddTypedParameters<ConferenceMapper>()
                .AddTypedParameters<EndpointsResponseMapper>()
                .AddTypedParameters<ParticipantDetailsResponseMapper>()
                .Build();
            
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, Conference>()).Returns(_mocker.Create<ConferenceMapper>(parameters));

            _controller = _mocker.Create<InternalEventController>();
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
            _mocker.Mock<IAllocationUpdatedEventNotifier>().Verify(x => x.PushAllocationUpdatedEvent(allocationHearingsToCsoRequest.AllocatedCsoUsername, It.IsAny<List<Conference>>()), Times.Once);
        }
    }
}
