using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using FluentAssertions;
using VideoApi.Client;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using VideoWeb.UnitTests.Builders;
using System.Net;
using VideoWeb.Helpers;
using VideoWeb.EventHub.Services;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    [TestFixture]
    class GetLayoutForHearingTests
    {
        private AutoMock _mocker;
        private ConferenceManagementController _sut;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<ConferenceManagementController>();
        }

        [Test]
        public async Task should_return_the_layout_for_the_hearing()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;
            var conference = new Conference()
            {
                Id = conferenceId
            };

            _mocker.Mock<IHearingLayoutService>().Setup(x => x.GetCurrentLayout(It.Is<Guid>(x => x == conferenceId))).ReturnsAsync(expectedLayout);

            // Act
            var layoutResponse = await _sut.GetLayoutForHearing(conferenceId);

            // Assert
            layoutResponse.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().Be(expectedLayout);
        }

        [Test]
        public async Task should_return_a_404_if_the_layout_returned_is_null()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            var exception = new VideoApiException("message", 404, null, null, null);
            _mocker.Mock<IHearingLayoutService>().Setup(x => x.GetCurrentLayout(It.Is<Guid>(x => x == conferenceId))).Returns(Task.FromResult<HearingLayout?>(null));

            // Act
            var layoutResponse = await _sut.GetLayoutForHearing(conferenceId);

            // Assert
            layoutResponse.Should().BeAssignableTo<NotFoundResult>();
        }
        
        [Test]
        public async Task GetLayoutForHearing_handles_when_GetCurrentLayoutThrows_VideoApiException()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            var exception = new VideoApiException("message", 404, null, null, null);
            _mocker.Mock<IHearingLayoutService>()
                .Setup(x => x.GetCurrentLayout(It.IsAny<Guid>()))
                .Throws(exception);

            // Act
            var result = await _sut.GetLayoutForHearing(conferenceId) as ObjectResult;

            // Assert
            result.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
        }
        
        [Test]
        public async Task GetLayoutForHearing_handles_when_GetCurrentLayoutThrows_Exception()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            _mocker.Mock<IHearingLayoutService>()
                .Setup(x => x.GetCurrentLayout(It.IsAny<Guid>()))
                .Throws<Exception>();

            // Act
            var result = await _sut.GetLayoutForHearing(conferenceId) as StatusCodeResult;

            // Assert
            result.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        }
    }
}
