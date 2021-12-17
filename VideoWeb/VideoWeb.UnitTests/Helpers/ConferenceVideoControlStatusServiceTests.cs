using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers;

namespace VideoWeb.UnitTests.Helpers
{
    [TestFixture]
    public class ConferenceVideoControlStatusServiceTests
    {
        private AutoMock _mocker;
        private ConferenceVideoControlStatusService _sut;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<ConferenceVideoControlStatusService>();
        }

        [Test]
        public async Task SetVideoControlStateForConference_should_update_cache_with_correct_values()
        {
            // Arrange
            Guid conferenceId = Guid.NewGuid();
            ConferenceVideoControlStatuses conferenceVideoControlStatuses = new ConferenceVideoControlStatuses();
            
            // Act
            await _sut.SetVideoControlStateForConference(conferenceId, conferenceVideoControlStatuses);

            // Assert
            _mocker.Mock<IConferenceVideoControlStatusCache>().Verify(x => x.WriteToCache(conferenceId, conferenceVideoControlStatuses), Times.Once);
        } 
        
        [Test]
        public async Task SetVideoControlStateForConference_should_update_cache_with_null()
        {
            // Arrange
            Guid conferenceId = Guid.NewGuid();
            
            // Act
            await _sut.SetVideoControlStateForConference(conferenceId, null);

            // Assert
            _mocker.Mock<IConferenceVideoControlStatusCache>().Verify(x => x.WriteToCache(conferenceId, null), Times.Once);
        } 

        
        [Test]
        public async Task GetVideoControlStateForConference_should_return_correct_values_from_the_cache()
        {
            // Arrange
            Guid conferenceId = Guid.NewGuid();
            ConferenceVideoControlStatuses conferenceVideoControlStatuses = new ConferenceVideoControlStatuses();
            
            _mocker.Mock<IConferenceVideoControlStatusCache>().Setup(x => x.ReadFromCache(conferenceId)).ReturnsAsync(conferenceVideoControlStatuses);

            
            // Act
            var result = await _sut.GetVideoControlStateForConference(conferenceId);

            // Assert
            _mocker.Mock<IConferenceVideoControlStatusCache>().Verify(x => x.ReadFromCache(conferenceId), Times.Once);
            result.Should().Be(conferenceVideoControlStatuses);
        } 
        
        [Test]
        public async Task GetVideoControlStateForConference_should_return_correct_values_from_the_cache_even_when_null()
        {
            // Arrange
            Guid conferenceId = Guid.NewGuid();
            
            _mocker.Mock<IConferenceVideoControlStatusCache>().Setup(x => x.ReadFromCache(conferenceId)).ReturnsAsync((ConferenceVideoControlStatuses?)null);

            
            // Act
            var result = await _sut.GetVideoControlStateForConference(conferenceId);

            // Assert
            _mocker.Mock<IConferenceVideoControlStatusCache>().Verify(x => x.ReadFromCache(conferenceId), Times.Once);
            result.Should().BeNull();
        }

        [Test]
        public async Task
            UpdateMediaStatusForParticipantInConference_should_get_existing_state_and_update_it_for_a_given_participant()
        {
            // Arrange
            Guid conferenceId = Guid.NewGuid();
            string participantId = "participant-id";
            bool isSpotlighted = false;
            ParticipantMediaStatus participantMediaStatus = new ParticipantMediaStatus()
            {
                IsLocalAudioMuted = false,
                IsLocalVideoMuted = true
            };
            
            ConferenceVideoControlStatuses existingConferenceVideoControlStatuses = new ConferenceVideoControlStatuses();
            existingConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatus>();
            existingConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap.Add(participantId, new VideoControlStatus()
            {
                IsSpotlighted = isSpotlighted,
                IsLocalAudioMuted = !participantMediaStatus.IsLocalAudioMuted,
                IsLocalVideoMuted = !participantMediaStatus.IsLocalVideoMuted,
            });

            ConferenceVideoControlStatuses expectedConferenceVideoControlStatuses = new ConferenceVideoControlStatuses();
            expectedConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatus>();
            expectedConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap.Add(participantId, new VideoControlStatus()
            {
                IsSpotlighted = isSpotlighted,
                IsLocalAudioMuted = participantMediaStatus.IsLocalAudioMuted,
                IsLocalVideoMuted = participantMediaStatus.IsLocalVideoMuted,
            });
            

            _mocker.Mock<IConferenceVideoControlStatusCache>().Setup(x => x.ReadFromCache(conferenceId))
                .ReturnsAsync(existingConferenceVideoControlStatuses);

            // Act
            await _sut.UpdateMediaStatusForParticipantInConference(conferenceId, participantId, participantMediaStatus);
            
            // Assert
            _mocker.Mock<IConferenceVideoControlStatusCache>().Verify(x => x.WriteToCache(conferenceId, It.Is<ConferenceVideoControlStatuses>(y => expectedConferenceVideoControlStatuses.CompareTo(y) > 0)), Times.Once);
        }
        
        [Test]
        public async Task UpdateMediaStatusForParticipantInConference_should_add_entry_if_there_was_no_existing_state_for_the_participant()
        {
            // Arrange
            Guid conferenceId = Guid.NewGuid();
            string participantId = "participant-id";
            ParticipantMediaStatus participantMediaStatus = new ParticipantMediaStatus()
            {
                IsLocalAudioMuted = false,
                IsLocalVideoMuted = true
            };
            
            ConferenceVideoControlStatuses existingConferenceVideoControlStatuses = new ConferenceVideoControlStatuses();
            existingConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatus>();
            
            ConferenceVideoControlStatuses expectedConferenceVideoControlStatuses = new ConferenceVideoControlStatuses();
            expectedConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatus>();
            expectedConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap.Add(participantId, new VideoControlStatus()
            {
                IsSpotlighted = false,
                IsLocalAudioMuted = participantMediaStatus.IsLocalAudioMuted,
                IsLocalVideoMuted = participantMediaStatus.IsLocalVideoMuted,
            });
            

            _mocker.Mock<IConferenceVideoControlStatusCache>().Setup(x => x.ReadFromCache(conferenceId))
                .ReturnsAsync(existingConferenceVideoControlStatuses);

            // Act
            await _sut.UpdateMediaStatusForParticipantInConference(conferenceId, participantId, participantMediaStatus);
            
            // Assert
            _mocker.Mock<IConferenceVideoControlStatusCache>().Verify(x => x.WriteToCache(conferenceId, It.Is<ConferenceVideoControlStatuses>(y => expectedConferenceVideoControlStatuses.CompareTo(y) > 0)), Times.Once);
        }
        
        [Test]
        public async Task UpdateMediaStatusForParticipantInConference_should_add_entry_if_there_was_no_existing_state_for_the_conference()
        {
            // Arrange
            Guid conferenceId = Guid.NewGuid();
            string participantId = "participant-id";
            ParticipantMediaStatus participantMediaStatus = new ParticipantMediaStatus()
            {
                IsLocalAudioMuted = false,
                IsLocalVideoMuted = true
            };

            
            ConferenceVideoControlStatuses expectedConferenceVideoControlStatuses = new ConferenceVideoControlStatuses();
            expectedConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatus>();
            expectedConferenceVideoControlStatuses.ParticipantIdToVideoControlStatusMap.Add(participantId, new VideoControlStatus()
            {
                IsSpotlighted = false,
                IsLocalAudioMuted = participantMediaStatus.IsLocalAudioMuted,
                IsLocalVideoMuted = participantMediaStatus.IsLocalVideoMuted,
            });
            

            ConferenceVideoControlStatuses existingConferenceVideoControlStatuses = null;
            _mocker.Mock<IConferenceVideoControlStatusCache>().Setup(x => x.ReadFromCache(conferenceId))
                .ReturnsAsync(existingConferenceVideoControlStatuses);

            // Act
            await _sut.UpdateMediaStatusForParticipantInConference(conferenceId, participantId, participantMediaStatus);
            
            // Assert
            _mocker.Mock<IConferenceVideoControlStatusCache>().Verify(x => x.WriteToCache(conferenceId, It.Is<ConferenceVideoControlStatuses>(y => expectedConferenceVideoControlStatuses.CompareTo(y) > 0)), Times.Once);
        }
    }
}
