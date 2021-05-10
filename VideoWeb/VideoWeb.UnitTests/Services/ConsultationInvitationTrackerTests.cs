using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Helpers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Services
{
    [TestFixture]
    public class ConsultationInvitationTrackerTests
    {
        private AutoMock _mocker;
        private Conference _conference;
        private IConsultationInvitationTracker _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _conference = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();
            _sut = _mocker.Create<ConsultationInvitationTracker>();
        }
        
        // [Start] StartTrackingInvitation
        [Test]
        public async Task Should_create_an_entry_in_the_cache_with_a_guid_representing_the_invitation_if_the_conference_has_linked_participants()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            _mocker.Mock<IConsultationInvitationCache>().Setup(crc => crc.Write(It.IsAny<ConsultationInvitation>()));

            // Act
            var invitationGuid = await _sut.StartTrackingInvitation(_conference, "room_label", requestedForParticipant.Id);

            // Assert
            invitationGuid.Should().NotBe(Guid.Empty);
            _mocker.Mock<IConsultationInvitationCache>()
                .Verify(crc => crc.Write(
                        It.Is<ConsultationInvitation>(ci =>
                            ci.RequestedForParticipantId == requestedForParticipant.Id &&
                            ci.InvitedParticipantResponses.Count == 1 + requestedForParticipant.LinkedParticipants.Count)), 
                    Times.Once);
        }
        
        [Test]
        public async Task Should_create_an_entry_in_the_cache_with_a_guid_representing_the_invitation_if_the_conference_DOES_NOT_have_linked_participants()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => !p.LinkedParticipants.Any());
            _mocker.Mock<IConsultationInvitationCache>().Setup(crc => crc.Write(It.IsAny<ConsultationInvitation>()));
            
            // Act
            var invitationGuid = await _sut.StartTrackingInvitation(_conference, "room_label", requestedForParticipant.Id);

            // Assert
            invitationGuid.Should().NotBe(Guid.Empty);
            _mocker.Mock<IConsultationInvitationCache>()
                .Verify(crc => crc.Write(It.IsAny<ConsultationInvitation>()), 
                    Times.Once);
        }

        [Test]
        public async Task Should_return_the_invitation_if_it_is_tracked()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            ConsultationInvitation expectedConsultationInvitation = ConsultationInvitation.Create(requestedForParticipant.Id, "room_label", requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));
            _mocker.Mock<IConsultationInvitationCache>().Setup(crc => crc.Read(It.IsAny<Guid>()))
                .ReturnsAsync(expectedConsultationInvitation);

            // Act
            var invitation = await _sut.GetInvitation(expectedConsultationInvitation.InvitationId);

            // Assert
            invitation.Should().Be(expectedConsultationInvitation);
        }
        
        [Test]
        public async Task Should_return_the_null_if_it_is_NOT_tracked()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            ConsultationInvitation expectedConsultationInvitation = ConsultationInvitation.Create(requestedForParticipant.Id,"room_label", requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));
            _mocker.Mock<IConsultationInvitationCache>().Setup(crc => crc.Read(It.IsAny<Guid>()))
                .ReturnsAsync(null as ConsultationInvitation);

            // Act
            var invitation = await _sut.GetInvitation(expectedConsultationInvitation.InvitationId);

            // Assert
            invitation.Should().BeNull();
        }
        
        [Test]
        public async Task Should_return_null_if_the_GUID_is_empty()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            ConsultationInvitation expectedConsultationInvitation = ConsultationInvitation.Create(requestedForParticipant.Id, "room_label",requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));
            _mocker.Mock<IConsultationInvitationCache>().Setup(crc => crc.Read(It.IsAny<Guid>()))
                .ReturnsAsync(null as ConsultationInvitation);

            // Act
            var invitation = await _sut.GetInvitation(expectedConsultationInvitation.InvitationId);

            // Assert
            invitation.Should().BeNull();
        }

        [Test]
        public async Task Should_return_HaveAllParticipantsAccepted_result_from_consultation_invite_method()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            ConsultationInvitation expectedConsultationInvitation = ConsultationInvitation.Create(
                requestedForParticipant.Id, "room_label",requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));

            foreach (var invitedParticipantResponseKey in expectedConsultationInvitation.InvitedParticipantResponses.Keys)
                expectedConsultationInvitation.InvitedParticipantResponses[invitedParticipantResponseKey] = ConsultationAnswer.Accepted;

            _mocker.Mock<IConsultationInvitationCache>().Setup(crc => crc.Read(It.IsAny<Guid>()))
                .ReturnsAsync(expectedConsultationInvitation);
            
            // Act
            var haveAllParticipantsAccepted = await _sut.HaveAllParticipantsAccepted(expectedConsultationInvitation.InvitationId);

            // Assert
            _mocker.Mock<IConsultationInvitationCache>().Verify(crc => crc.Read(It.Is<Guid>(x => x == expectedConsultationInvitation.InvitationId)), Times.Once);
            haveAllParticipantsAccepted.Should().BeTrue();
        }
        
        [Test]
        public async Task Should_return_false_for_all_accepted_if_the_consultation_invite_DOES_NOT_exist()
        {
            // Arrange
            _mocker.Mock<IConsultationInvitationCache>().Setup(crc => crc.Read(It.IsAny<Guid>()))
                .ReturnsAsync(null as ConsultationInvitation);
            
            // Act
            var haveAllParticipantsAccepted = await _sut.HaveAllParticipantsAccepted(Guid.Empty);

            // Assert
            haveAllParticipantsAccepted.Should().BeFalse();
        }

        [TestCase(ConsultationAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Rejected)]
        [TestCase(ConsultationAnswer.Failed)]
        [TestCase(ConsultationAnswer.Transferring)]
        public async Task Should_return_HaveAllResponded_result_from_consultation_invite_method(ConsultationAnswer answer)
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            ConsultationInvitation expectedConsultationInvitation = ConsultationInvitation.Create(
                requestedForParticipant.Id, "room_label",requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));

            foreach (var invitedParticipantResponseKey in expectedConsultationInvitation.InvitedParticipantResponses.Keys)
            {
                expectedConsultationInvitation.InvitedParticipantResponses[invitedParticipantResponseKey] = answer;
            }

            _mocker.Mock<IConsultationInvitationCache>().Setup(crc => crc.Read(It.IsAny<Guid>()))
                .ReturnsAsync(expectedConsultationInvitation);
            
            // Act
            var haveAllParticipantsAccepted = await _sut.HaveAllParticipantsResponded(expectedConsultationInvitation.InvitationId);

            // Assert
            _mocker.Mock<IConsultationInvitationCache>().Verify(crc => crc.Read(It.Is<Guid>(x => x == expectedConsultationInvitation.InvitationId)), Times.Once);
            haveAllParticipantsAccepted.Should().BeTrue();
        }
        
        [Test]
        public async Task Should_return_false_for_all_responded_if_the_consultation_invite_DOES_NOT_exist()
        {
            // Arrange
            _mocker.Mock<IConsultationInvitationCache>().Setup(crc => crc.Read(It.IsAny<Guid>()))
                .ReturnsAsync(null as ConsultationInvitation);
            
            // Act
            var haveAllParticipantsAccepted = await _sut.HaveAllParticipantsAccepted(Guid.Empty);

            // Assert
            haveAllParticipantsAccepted.Should().BeFalse();
        }

        [Test]
        public async Task Should_update_an_invitation_if_it_exists()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var roomLabel = "room_label";
            var invitationToUpdate =
                ConsultationInvitation.Create(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            _mocker.Mock<IConsultationInvitationCache>().Setup(x => x.Read(It.IsAny<Guid>()))
                .ReturnsAsync(invitationToUpdate);

            // Act
            await _sut.UpdateConsultationResponse(invitationToUpdate.InvitationId, linkedParticipantGuid,
                ConsultationAnswer.Accepted);

            // Assert
            _mocker.Mock<IConsultationInvitationCache>()
                .Verify(x => x.Read(It.Is<Guid>(y => y == invitationToUpdate.InvitationId)), Times.Once);
            _mocker.Mock<IConsultationInvitationCache>().Verify(x => x.Write(It.Is<ConsultationInvitation>(y =>
                y.InvitedParticipantResponses[participantGuid] == ConsultationAnswer.None &&
                y.InvitedParticipantResponses[linkedParticipantGuid] == ConsultationAnswer.Accepted
            )), Times.Once);
        }
        
        [Test]
        public async Task Should_NOT_update_an_invitation_if_it_DOES_NOT_exist()
        {
            // Arrange
            var participantGuid = Guid.NewGuid();
            var linkedParticipantGuid = Guid.NewGuid();
            var roomLabel = "room_label";
            var invitationToUpdate =
                ConsultationInvitation.Create(participantGuid, roomLabel, new[] {linkedParticipantGuid});

            _mocker.Mock<IConsultationInvitationCache>().Setup(x => x.Read(It.IsAny<Guid>()))
                .ReturnsAsync(null as ConsultationInvitation);

            // Act
            await _sut.UpdateConsultationResponse(invitationToUpdate.InvitationId, linkedParticipantGuid,
                ConsultationAnswer.Accepted);

            // Assert
            _mocker.Mock<IConsultationInvitationCache>()
                .Verify(x => x.Read(It.Is<Guid>(y => y == invitationToUpdate.InvitationId)), Times.Once);
            _mocker.Mock<IConsultationInvitationCache>().Verify(x => x.Write(It.IsAny<ConsultationInvitation>()), Times.Never);
        }
    }
}
