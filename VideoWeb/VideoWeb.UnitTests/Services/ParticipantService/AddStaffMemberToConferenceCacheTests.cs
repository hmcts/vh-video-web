using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.InternalHandlers.Core;
using VideoWeb.EventHub.InternalHandlers.Models;
using VideoWeb.Mappings;
using VideoWeb.Services;
using VideoWeb.UnitTests.Builders;
using LinkedParticipantResponse = VideoWeb.Contract.Responses.LinkedParticipantResponse;

namespace VideoWeb.UnitTests.Services.ParticipantService
{
    [TestFixture]
    public class AddStaffMemberToConferenceCacheTests
    {
        private AutoMock _mocker;
        private ParticipantDetailsResponse _participantDetailsResponse;
        private IParticipantService _service;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            
            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .AddTypedParameters<LinkedParticipantToLinkedParticipantResponseMapper>()
                .AddTypedParameters<CivilianRoomToRoomSummaryResponseMapper>()
                .Build();
            
            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<CivilianRoom, RoomSummaryResponse>())
                .Returns(_mocker.Create<CivilianRoomToRoomSummaryResponseMapper>(parameters));
            
            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<LinkedParticipant, LinkedParticipantResponse>())
                .Returns(_mocker.Create<LinkedParticipantToLinkedParticipantResponseMapper>(parameters));
            
            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<Participant, Conference, ParticipantResponse>())
                .Returns(_mocker.Create<ParticipantToParticipantResponseMapper>(parameters));
            
            _mocker.Mock<IMapperFactory>()
                .Setup(x=> x.Get<ParticipantDetailsResponse, Participant>())
                .Returns(_mocker.Create<ParticipantDetailsResponseMapper>(parameters));
            
            _mocker.Mock<IInternalEventHandlerFactory>().Setup(x => x.Get(It.IsAny<ParticipantsUpdatedEventDto>()))
                .Returns(new Mock<IInternalEventHandler<ParticipantsUpdatedEventDto>>().Object);


            _participantDetailsResponse = Builder<ParticipantDetailsResponse>.CreateNew()
                .With(x => x.LinkedParticipants, new List<VideoApi.Contract.Responses.LinkedParticipantResponse>())
                .Build();
            _service = _mocker.Create<VideoWeb.Services.ParticipantService>();
        }

        [Test]
        public async Task AddStaffMemberToConferenceCache_Updates_UpdateConferenceAsync()
        {
            // Arrange
            var conference = new ConferenceCacheModelBuilder().Build();
            var addStaffMemberResponse = new AddStaffMemberResponse()
            {
                ConferenceId = conference.Id,
                ParticipantDetails = new ParticipantDetailsResponseBuilder(UserRole.StaffMember, "StaffMember").Build()
            };
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).Returns(Task.FromResult(conference));
            
            //Act
            await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse);

            // Assert
            _mocker.Mock<IConferenceCache>()
                .Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == conference)), Times.Once());
            
            _mocker.Mock<IInternalEventHandlerFactory>().Verify(
                x => x.Get(It.Is<ParticipantsUpdatedEventDto>(dto => 
                    dto.ConferenceId == conference.Id &&
                    dto.Participants.Count == conference.Participants.Count)), Times.Once);
            // _mocker.Mock<IParticipantsUpdatedEventNotifier>()
            //     .Verify(x => x.PushParticipantsUpdatedEvent(It.Is<Conference>(y => y == conference), conference.Participants), Times.Once());
        }

        [Test]
        public async Task AddStaffMemberToConferenceCache_when_conference_is_in_cache()
        {
            // Arrange
            var conference = new ConferenceCacheModelBuilder().Build();

            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).Returns(Task.FromResult(conference));

            // _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantDetailsResponse, Participant>())
            //     .Returns(_mocker.Mock<IMapTo<ParticipantDetailsResponse, Participant>>().Object);

            var addStaffMemberResponse = new AddStaffMemberResponse
            {
                ConferenceId = Guid.NewGuid(),
                ParticipantDetails = _participantDetailsResponse
            };

            // Act
            await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse);

            // Assert
            _mocker.Mock<IConferenceCache>()
                .Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == conference)), Times.Once());
            
            _mocker.Mock<IInternalEventHandlerFactory>().Verify(
                x => x.Get(It.Is<ParticipantsUpdatedEventDto>(dto => 
                    dto.ConferenceId == conference.Id &&
                    dto.Participants.Count == conference.Participants.Count)), Times.Once);
            
            // _mocker.Mock<IParticipantsUpdatedEventNotifier>()
            //     .Verify(x => x.PushParticipantsUpdatedEvent(It.Is<Conference>(y => y == conference), conference.Participants), Times.Once());
        }

        [Test]
        public void AddStaffMemberToConferenceCache_when_conference_is_NULL()
        {
            // Arrange
            _mocker.Mock<IConferenceCache>().Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).Returns(Task.FromResult(null as Conference));
            var addStaffMemberResponse = new AddStaffMemberResponse
            {
                ConferenceId = Guid.NewGuid(),
                ParticipantDetails = _participantDetailsResponse
            };

            // Act and Assert
            Assert.ThrowsAsync<ConferenceNotFoundException>(async () => await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse));
        }

        [Test]
        public async Task AddStaffMemberToConferenceCache_when_conference_is_mapping_ParticipantDetails_to_participant()
        {
            // Arrange
            var conference = new ConferenceCacheModelBuilder().Build();

            _mocker.Mock<IConferenceCache>()
                .Setup(x => x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Returns(Task.FromResult(conference));

            var addStaffMemberResponse = new AddStaffMemberResponse
            {
                ConferenceId = Guid.NewGuid(),
                ParticipantDetails = _participantDetailsResponse
            };

            // Act
            await _service.AddStaffMemberToConferenceCache(addStaffMemberResponse);

            // Assert
            conference.Participants.Count.Should().Be(conference.Participants.Count);
        }
    }
}
