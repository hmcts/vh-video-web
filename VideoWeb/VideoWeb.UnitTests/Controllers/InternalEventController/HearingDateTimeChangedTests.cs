using System;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.UnitTests.Builders;
namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class HearingDateTimeChangedTests
    {
        private AutoMock _mocker;
        private VideoWeb.Controllers.InternalEventController _controller;

        [SetUp]
        public void SetUp()
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

            _mocker.Mock<IHearingDateTimeChangedEventNotifier>();
        }
        
        [Test]
        public async Task should_push_event()
        {
            // Arrange
            var hearingId = Guid.NewGuid();

            // Act
            var result = await _controller.HearingDateTimeChanged(hearingId);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IHearingDateTimeChangedEventNotifier>().Verify(x => x.PushHearingDateTimeChangedEvent(hearingId), Times.Once);
        }
    }
}
