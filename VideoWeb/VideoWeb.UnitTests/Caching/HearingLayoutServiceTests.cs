using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Hub;
using VideoWeb.Helpers;

namespace VideoWeb.UnitTests.Caching
{
    [TestFixture]
    class HearingLayoutServiceTests
    {
        private AutoMock _mocker;
        private HearingLayoutService _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<HearingLayoutService>();

            _mocker.Mock<IHubClients<IEventHubClient>>()
                .Setup(x => x.Group(It.IsAny<string>()))
                .Returns(_mocker.Mock<IEventHubClient>().Object);

            _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>()
                .Setup(x => x.Clients)
                .Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);
        }

        [Test]
        public async Task GetCurrentLayout_should_return_the_current_layout_for_the_conference()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;
            var conference = new Conference()
            {
                Id = conferenceId
            };

            _mocker.Mock<IHearingLayoutCache>().Setup(x => x.Read(conferenceId)).ReturnsAsync(expectedLayout);
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

            var exception = new VideoApiException("message", 404, null, null, null);
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ThrowsAsync(exception);

            // Act
            var layout = await _sut.GetCurrentLayout(conferenceId);

            // Assert
            layout.Should().BeNull();
        }

        [Test]
        public void GetCurrentLayout_should_throw_video_api_exception_if_they_are_not_for_a_404_error()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            var exception = new VideoApiException("message", 403, null, null, null);
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ThrowsAsync(exception);

            // Act && Assert
            Func<Task> action = async () => await _sut.GetCurrentLayout(conferenceId);
            action.Should().Throw<VideoApiException>();
        }

        [Test]
        public void GetCurrentLayout_should_throw_NON_video_api_exceptions()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();

            var exception = new Exception();
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ThrowsAsync(exception);

            // Act && Assert
            Func<Task> action = async () => await _sut.GetCurrentLayout(conferenceId);
            action.Should().Throw<Exception>();
        }

        [Test]
        public async Task UpdateLayout_should_update_conference_cache_and_raise_event_hub_event_for_judges_and_staff_memebers()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var changedById = Guid.NewGuid();
            var defaultLayout = HearingLayout.Dynamic;
            var expectedLayout = HearingLayout.TwoPlus21;
            var participants = BuildParticipantListWithAllRoles();

            var conference = new Conference()
            {
                Id = conferenceId,
                Participants = participants
            };
            var conferenceUpdate = new Conference()
            {
                Id = conferenceId,
                Participants = participants
            };

            var exception = new Exception();
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(conference);
            _mocker.Mock<IHearingLayoutCache>().Setup(x => x.Read(It.Is<Guid>(x => x == conferenceId))).ReturnsAsync(defaultLayout);


            _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>().Setup(x => x.Clients)
                .Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);

            Func<IEnumerable<string>, bool> onlyContainsHosts = (groups) => groups.All(group => participants.Where(participant => participant.Role == Role.Judge || participant.Role == Role.StaffMember).Select(participant => participant.Username).Contains(group));
            _mocker.Mock<IHubClients<IEventHubClient>>().Setup(x => x.Groups(It.Is<IReadOnlyList<string>>(y => onlyContainsHosts(y))))
                .Returns(_mocker.Mock<IEventHubClient>().Object);

            // Act
            await _sut.UpdateLayout(conferenceId, changedById, expectedLayout);

            // Assert
            _mocker.Mock<IHearingLayoutCache>().Verify(x => x.Write(conferenceId, expectedLayout), Times.Once);
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.HearingLayoutChanged(conferenceId, changedById, expectedLayout, defaultLayout),
                Times.Once);
        }

        [Test]
        public async Task UpdateLayout_should_NOT_update_conference_cache_or_raise_event_hub_event_for_judges_and_staff_memebers_when_an_exception_is_thrown()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var changedById = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;


            var exception = new Exception();
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ThrowsAsync(new Exception());

            // Act
            await _sut.UpdateLayout(conferenceId, changedById, expectedLayout);

            // Assert
            _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.IsAny<Conference>()), Times.Never);
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.HearingLayoutChanged(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<HearingLayout>(), It.IsAny<HearingLayout>()),
                Times.Never);
        }

        private List<Participant> BuildParticipantListWithAllRoles()
        {
            var participants = new List<Participant>();
            participants.Add(new Participant()
            {
                Id = Guid.NewGuid(),
                Username = Guid.NewGuid().ToString(),
                Role = Role.Judge
            });
            participants.Add(new Participant()
            {
                Id = Guid.NewGuid(),
                Username = Guid.NewGuid().ToString(),
                Role = Role.StaffMember
            });
            participants.Add(new Participant()
            {
                Id = Guid.NewGuid(),
                Username = Guid.NewGuid().ToString(),
                Role = Role.JudicialOfficeHolder
            });
            participants.Add(new Participant()
            {
                Id = Guid.NewGuid(),
                Username = Guid.NewGuid().ToString(),
                Role = Role.Individual
            });
            participants.Add(new Participant()
            {
                Id = Guid.NewGuid(),
                Username = Guid.NewGuid().ToString(),
                Role = Role.CaseAdmin
            });
            participants.Add(new Participant()
            {
                Id = Guid.NewGuid(),
                Username = Guid.NewGuid().ToString(),
                Role = Role.QuickLinkObserver
            });
            participants.Add(new Participant()
            {
                Id = Guid.NewGuid(),
                Username = Guid.NewGuid().ToString(),
                Role = Role.QuickLinkParticipant
            });
            participants.Add(new Participant()
            {
                Id = Guid.NewGuid(),
                Username = Guid.NewGuid().ToString(),
                Role = Role.None
            });

            return participants;
        }
    }
}
