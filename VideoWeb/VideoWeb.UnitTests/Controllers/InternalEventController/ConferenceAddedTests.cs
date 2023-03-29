using System;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.InternalHandlers.Core;
using VideoWeb.EventHub.InternalHandlers.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class ConferenceAddedTests
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

            _controller = _mocker.Create<VideoWeb.Controllers.InternalEventController>();
            _controller.ControllerContext = context;

            _mocker.Mock<IInternalEventHandlerFactory>().Setup(x => x.Get(It.IsAny<NewConferenceAddedEventDto>()))
                .Returns(new Mock<IInternalEventHandler<NewConferenceAddedEventDto>>().Object);
        }

        [Test]
        public async Task Sends_Event_For_New_Conference_Added()
        {
            var conferenceId = Guid.NewGuid();

            var result = await _controller.ConferenceAdded(conferenceId);

            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IInternalEventHandlerFactory>().Verify(
                x => x.Get(It.Is<NewConferenceAddedEventDto>(dto => 
                    dto.ConferenceId == conferenceId)), Times.Once);
        }
    }
}
