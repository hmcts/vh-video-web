using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoWeb.Controllers;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventControllerTests
{
    public class ConferenceAddedTests
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

            _controller = _mocker.Create<InternalEventController>();
            _controller.ControllerContext = context;

            _mocker.Mock<INewConferenceAddedEventNotifier>();
        }

        [Test]
        public async Task Sends_Event_For_New_Conference_Added()
        {
            var conferenceId = Guid.NewGuid();

            var result = await _controller.ConferenceAdded(conferenceId);

            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<INewConferenceAddedEventNotifier>().Verify(x => x.PushNewConferenceAddedEvent(conferenceId), Times.Once);
        }
    }
}
