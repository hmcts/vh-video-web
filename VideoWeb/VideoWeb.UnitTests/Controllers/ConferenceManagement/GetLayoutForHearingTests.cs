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
using Microsoft.AspNetCore.Mvc;
using FluentAssertions;
using VideoApi.Client;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using VideoWeb.UnitTests.Builders;
using System.Net;

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
                Id = conferenceId,
                HearingLayout = expectedLayout
            };

            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid> (x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(conference);

            // Act
            var layoutResponse = await _sut.GetLayoutForHearing(conferenceId);

            // Assert
            layoutResponse.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().Be(expectedLayout);
        }

        [Test]
        public async Task should_return_a_404_if_the_hearing_cannot_be_found()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            var exception = new VideoApiException("message", 404, null, null, null);
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ThrowsAsync(exception);

            // Act
            var layoutResponse = await _sut.GetLayoutForHearing(conferenceId);

            // Assert
            layoutResponse.Should().BeAssignableTo<NotFoundResult>();
        }
    }
}
