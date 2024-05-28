using Autofac.Extras.Moq;
using FizzWare.NBuilder;
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

            _mocker.Mock<IHearingLayoutCache>().Setup(x => x.ReadFromCache(conferenceId)).ReturnsAsync(expectedLayout);
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(conference);

            // Act
            var layout = await _sut.GetCurrentLayout(conferenceId);

            // Assert
            layout.Should().Be(expectedLayout);
        }

        [Test]
        public async Task GetCurrentLayout_should_return_the_default_layout_for_the_conference_when_there_is_no_layout_in_the_cache()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var conference = new Conference()
            {
                Id = conferenceId,
                Participants = new List<Participant>()
            };
            var expectedLayout = conference.GetRecommendedLayout();

            _mocker.Mock<IHearingLayoutCache>().Setup(x => x.ReadFromCache(conferenceId)).Returns(Task.FromResult<HearingLayout?>(null));
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
            action.Should().ThrowAsync<VideoApiException>();
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
            action.Should().ThrowAsync<Exception>();
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
            var expectedHostGroups = participants.Where(participant => participant.IsHost()).Select(participant => participant.Username.ToLowerInvariant());

            var conference = new Conference()
            {
                Id = conferenceId,
                Participants = participants
            };

            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(conference);
            _mocker.Mock<IHearingLayoutCache>().Setup(x => x.ReadFromCache(It.Is<Guid>(x => x == conferenceId))).ReturnsAsync(defaultLayout);


            _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>().Setup(x => x.Clients)
                .Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);

            _mocker.Mock<IHubClients<IEventHubClient>>().Setup(x => x.Groups(It.IsAny<IReadOnlyList<string>>()))
                .Returns(_mocker.Mock<IEventHubClient>().Object);

            // Act
            await _sut.UpdateLayout(conferenceId, changedById, expectedLayout);

            // Assert
            _mocker.Mock<IHearingLayoutCache>().Verify(x => x.WriteToCache(conferenceId, expectedLayout), Times.Once);
            _mocker.Mock<IHubClients<IEventHubClient>>().Verify(x => x.Groups(It.Is<IReadOnlyList<string>>(groups => groups.All(group => expectedHostGroups.Contains(group)))), Times.Once);
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.HearingLayoutChanged(conferenceId, changedById, expectedLayout, defaultLayout),
                Times.Once);
        }

        [Test]
        public async Task UpdateLayout_should_return_the_default_layout_for_the_old_layout_if_there_was_not_one_in_the_cache()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var changedById = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;
            var participants = BuildParticipantListWithAllRoles();

            var conference = new Conference()
            {
                Id = conferenceId,
                Participants = participants
            };
            var defaultLayout = conference.GetRecommendedLayout();
            var expectedHostGroups = participants.Where(participant => participant.IsHost()).Select(participant => participant.Username.ToLowerInvariant());

            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(conference);
            _mocker.Mock<IHearingLayoutCache>().Setup(x => x.ReadFromCache(It.Is<Guid>(x => x == conferenceId))).Returns(Task.FromResult<HearingLayout?>(null));

            _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>().Setup(x => x.Clients)
                .Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);

            _mocker.Mock<IHubClients<IEventHubClient>>().Setup(x => x.Groups(It.IsAny<IReadOnlyList<string>>()))
                .Returns(_mocker.Mock<IEventHubClient>().Object);

            // Act
            await _sut.UpdateLayout(conferenceId, changedById, expectedLayout);

            // Assert
            _mocker.Mock<IHearingLayoutCache>().Verify(x => x.WriteToCache(conferenceId, expectedLayout), Times.Once);
            _mocker.Mock<IHubClients<IEventHubClient>>().Verify(x => x.Groups(It.Is<IReadOnlyList<string>>(groups => groups.All(group => expectedHostGroups.Contains(group)))), Times.Once);
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.HearingLayoutChanged(conferenceId, changedById, expectedLayout, defaultLayout),
                Times.Once);
        }

        [Test]
        public async Task UpdateLayout_should_not_hadnle_an_exception_when_getting_the_conference_from_the_cache_is_thrown()
        {
            // Arrange
            var conferenceId = Guid.NewGuid();
            var changedById = Guid.NewGuid();
            var expectedLayout = HearingLayout.TwoPlus21;


            var exception = new VideoApiException("message", 403, null, null, null);
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.Is<Guid>(x => x == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ThrowsAsync(exception);

            // Act
            Func<Task> action = async () => await _sut.UpdateLayout(conferenceId, changedById, expectedLayout);

            // Assert
            (await action.Should().ThrowExactlyAsync<VideoApiException>()).Which.Should().Be(exception);
            _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.IsAny<Conference>()), Times.Never);
            _mocker.Mock<IEventHubClient>().Verify(
                x => x.HearingLayoutChanged(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<HearingLayout>(), It.IsAny<HearingLayout>()),
                Times.Never);
        }

        private List<Participant> BuildParticipantListWithAllRoles()
        {
            return Builder<Participant>.CreateListOfSize(12)
                .TheFirst(1).With(x => x.Role = Role.Judge)
                .TheNext(1).With(x => x.Role = Role.StaffMember)
                .TheNext(1).With(x => x.Role = Role.CaseAdmin)
                .TheNext(1).With(x => x.Role = Role.HearingFacilitationSupport)
                .TheNext(1).With(x => x.Role = Role.JudicialOfficeHolder)
                .TheNext(1).With(x => x.Role = Role.None)
                .TheNext(1).With(x => x.Role = Role.CaseAdmin)
                .TheNext(1).With(x => x.Role = Role.QuickLinkObserver)
                .TheNext(1).With(x => x.Role = Role.QuickLinkParticipant)
                .TheNext(1).With(x => x.Role = Role.Representative)
                .TheNext(1).With(x => x.Role = Role.VideoHearingsOfficer)
                .TheRest().With(x => x.Role = Role.Individual).Build().ToList();
        }
    }
}
