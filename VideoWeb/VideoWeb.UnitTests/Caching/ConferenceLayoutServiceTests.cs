using Autofac.Extras.Moq;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Caching
{
    [TestFixture]
    class ConferenceLayoutServiceTests
    {
        private AutoMock _mocker;
        private ConferenceLayoutService _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<ConferenceLayoutService>();
        }

        [Test]
        public async Task GetCurrentLayout_should_return_the_current_layout_for_the_conference()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;
            var conference = new Conference()
            {
                Id = conferenceId,
                HearingLayout = expectedLayout
            };

            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(conference);

            // Act
            var layout = await _sut.GetCurrentLayout(conferenceId);

            // Assert
            layout.Should().Be(expectedLayout);
        }

        [Test]
        public async Task GetCurrentLayout_return_null_if_conference_could_NOT_be_found()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;
            var conference = new Conference()
            {
                Id = conferenceId,
                HearingLayout = expectedLayout
            };

            var exception = new VideoApiException("message", 404, null, null, null);
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ThrowsAsync(exception);

            // Act
            var layout = await _sut.GetCurrentLayout(conferenceId);

            // Assert
            layout.Should().BeNull();
        }

        [Test]
        public async Task GetCurrentLayout_should_throw_video_api_exception_if_they_are_not_for_a_404_error()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;
            var conference = new Conference()
            {
                Id = conferenceId,
                HearingLayout = expectedLayout
            };

            var exception = new VideoApiException("message", 403, null, null, null);
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ThrowsAsync(exception);

            // Act && Assert
            Action action = async () => await _sut.GetCurrentLayout(conferenceId);
            action.Should().Throw<VideoApiException>();
        }

        [Test]
        public async Task GetCurrentLayout_should_throw_NON_video_api_exceptions()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;
            var conference = new Conference()
            {
                Id = conferenceId,
                HearingLayout = expectedLayout
            };

            var exception = new Exception();
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ThrowsAsync(exception);

            // Act && Assert
            Action action = async () => await _sut.GetCurrentLayout(conferenceId);
            action.Should().Throw<Exception>();
        }
    }
}
