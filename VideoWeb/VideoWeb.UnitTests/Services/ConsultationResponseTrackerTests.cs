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
    public class ConsultationResponseTrackerTests
    {
        private AutoMock _mocker;
        private Conference _conference;
        private IConsultationResponseTracker _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _conference = new ConferenceCacheModelBuilder().WithLinkedParticipantsInRoom().Build();
            _sut = _mocker.Create<ConsultationResponseTracker>();
        }
        
        // [Start] StartTrackingInvitation
        [Test]
        public async Task Should_create_an_entry_in_the_cache_with_a_guid_representing_the_invitation_if_the_conference_has_linked_participants()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            _mocker.Mock<IConsultationResponseCache>().Setup(crc => crc.CreateInvitationEntry(It.IsAny<ConsultationInvitation>()));

            // Act
            var invitationGuid = await _sut.StartTrackingInvitation(_conference, "room_label", requestedForParticipant.Id);

            // Assert
            invitationGuid.Should().NotBe(Guid.Empty);
            _mocker.Mock<IConsultationResponseCache>()
                .Verify(crc => crc.CreateInvitationEntry(
                        It.Is<ConsultationInvitation>(ci =>
                            ci.RequestedForParticipantId == requestedForParticipant.Id &&
                            ci.InvitedParticipantResponses.Count == 1 + requestedForParticipant.LinkedParticipants.Count)), 
                    Times.Once);
        }
        
        [Test]
        public async Task Should_return_an_empty_guid_if_the_conference_does_NOT_have_linked_participants()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => !p.LinkedParticipants.Any());
            _mocker.Mock<IConsultationResponseCache>().Setup(crc => crc.CreateInvitationEntry(It.IsAny<ConsultationInvitation>()));
            
            // Act
            var invitationGuid = await _sut.StartTrackingInvitation(_conference, "room_label", requestedForParticipant.Id);

            // Assert
            invitationGuid.Should().Be(Guid.Empty);
            _mocker.Mock<IConsultationResponseCache>()
                .Verify(crc => crc.CreateInvitationEntry(It.IsAny<ConsultationInvitation>()), 
                    Times.Never);
        }

        [Test]
        public async Task Should_return_the_invitation_if_it_is_tracked()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            ConsultationInvitation expectedConsultationInvitation = new ConsultationInvitation(requestedForParticipant.Id, "room_label", requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));
            _mocker.Mock<IConsultationResponseCache>().Setup(crc => crc.GetInvitation(It.IsAny<Guid>()))
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
            ConsultationInvitation expectedConsultationInvitation = new ConsultationInvitation(requestedForParticipant.Id,"room_label", requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));
            _mocker.Mock<IConsultationResponseCache>().Setup(crc => crc.GetInvitation(It.IsAny<Guid>()))
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
            ConsultationInvitation expectedConsultationInvitation = new ConsultationInvitation(requestedForParticipant.Id, "room_label",requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));
            _mocker.Mock<IConsultationResponseCache>().Setup(crc => crc.GetInvitation(It.IsAny<Guid>()))
                .ReturnsAsync(null as ConsultationInvitation);

            // Act
            var invitation = await _sut.GetInvitation(expectedConsultationInvitation.InvitationId);

            // Assert
            invitation.Should().BeNull();
        }

        [Test]
        public async Task Should_call_delete_invitation_entry()
        {
            // Arrange
            var invitationId = Guid.NewGuid();
            
            // Act
            await _sut.StopTrackingInvitation(invitationId);

            // Assert
            _mocker.Mock<IConsultationResponseCache>().Verify(crc => crc.DeleteInvitationEntry(It.Is<Guid>(x => x == invitationId)), Times.Once);
        }

        [Test]
        public async Task Should_return_HaveAllParticipantsAccepted_result_from_consultation_invite_method()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            ConsultationInvitation expectedConsultationInvitation = new ConsultationInvitation(
                requestedForParticipant.Id, "room_label",requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));

            foreach (var invitedParticipantResponseKey in expectedConsultationInvitation.InvitedParticipantResponses.Keys)
                expectedConsultationInvitation.InvitedParticipantResponses[invitedParticipantResponseKey] = ConsultationAnswer.Accepted;

            _mocker.Mock<IConsultationResponseCache>().Setup(crc => crc.GetInvitation(It.IsAny<Guid>()))
                .ReturnsAsync(expectedConsultationInvitation);
            
            // Act
            var haveAllParticipantsAccepted = await _sut.HaveAllParticipantsAccepted(expectedConsultationInvitation.InvitationId);

            // Assert
            _mocker.Mock<IConsultationResponseCache>().Verify(crc => crc.GetInvitation(It.Is<Guid>(x => x == expectedConsultationInvitation.InvitationId)), Times.Once);
            haveAllParticipantsAccepted.Should().BeTrue();
        }
        
        [Test]
        public async Task Should_return_true_for_all_accepted_if_the_consultation_invite_DOES_NOT_exist()
        {
            // Arrange
            _mocker.Mock<IConsultationResponseCache>().Setup(crc => crc.GetInvitation(It.IsAny<Guid>()))
                .ReturnsAsync(null as ConsultationInvitation);
            
            // Act
            var haveAllParticipantsAccepted = await _sut.HaveAllParticipantsAccepted(Guid.Empty);

            // Assert
            haveAllParticipantsAccepted.Should().BeTrue();
        }

        [Test]
        public async Task Should_return_HaveAllResponded_result_from_consultation_invite_method()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            ConsultationInvitation expectedConsultationInvitation = new ConsultationInvitation(
                requestedForParticipant.Id, "room_label",requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId));

            _mocker.Mock<IConsultationResponseCache>().Setup(crc => crc.GetInvitation(It.IsAny<Guid>()))
                .ReturnsAsync(expectedConsultationInvitation);
            
            // Act
            var haveAllParticipantsAccepted = await _sut.HaveAllParticipantsResponded(expectedConsultationInvitation.InvitationId);

            // Assert
            _mocker.Mock<IConsultationResponseCache>().Verify(crc => crc.GetInvitation(It.Is<Guid>(x => x == expectedConsultationInvitation.InvitationId)), Times.Once);
            haveAllParticipantsAccepted.Should().BeTrue();
        }
        
        [Test]
        public async Task Should_return_true_for_all_responded_if_the_consultation_invite_DOES_NOT_exist()
        {
            // Arrange
            _mocker.Mock<IConsultationResponseCache>().Setup(crc => crc.GetInvitation(It.IsAny<Guid>()))
                .ReturnsAsync(null as ConsultationInvitation);
            
            // Act
            var haveAllParticipantsAccepted = await _sut.HaveAllParticipantsAccepted(Guid.Empty);

            // Assert
            haveAllParticipantsAccepted.Should().BeTrue();
        }

        [Test]
        public async Task Should_update_status_if_the_invitation_exists()
        {
            // Arrange
            var participantId = Guid.NewGuid();
            var invitationId = Guid.NewGuid();
            var answer = ConsultationAnswer.Accepted;

            // Act
            await _sut.UpdateConsultationResponse(invitationId, participantId, answer);

            // Assert
            _mocker.Mock<IConsultationResponseCache>().Verify(crc => crc.UpdateResponseToInvitation(invitationId, participantId, answer), Times.Once);
        }
        
        [Test]
        public async Task Should_call_delete_inventory_invitation_on_all_invitations_the_participant_is_part_of()
        {
            // Arrange
            var requestedForParticipant = _conference.Participants.First(p => p.LinkedParticipants.Any());
            var invitations = new List<ConsultationInvitation>();
            invitations.Add(new ConsultationInvitation(requestedForParticipant.Id, "room_label",
                requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId)));
            invitations.Add(new ConsultationInvitation(requestedForParticipant.Id, "room_label2",
                requestedForParticipant.LinkedParticipants.Select(x => x.LinkedId)));
            
            _mocker.Mock<IConsultationResponseCache>()
                .Setup(x => x.GetInvitationsForParticipant(requestedForParticipant.Id)).ReturnsAsync(invitations);
            
            // Act
            await _sut.StopTrackingInvitationsForParticipant(requestedForParticipant.Id);

            // Assert
            _mocker.Mock<IConsultationResponseCache>()
                .Verify(x => x.GetInvitationsForParticipant(requestedForParticipant.Id), Times.Once);

            foreach (var invitation in invitations)
            {
                _mocker.Mock<IConsultationResponseCache>()
                    .Verify(x => x.DeleteInvitationEntry(invitation.InvitationId), Times.Once);    
            }
        }
    }
}
