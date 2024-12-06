using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Hub
{
    public class ToggleParticipantLocalMuteTests : EventHubBaseTests
    {
        [Test]
        public async Task should_publish_requested_local_mute_status()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername, true);
            var conferenceId = conference.Id;
            var participant = conference.Participants.First(x => x.Username == participantUsername);
            var isLocalMuted = true;
            SetupEventHubClientsForAllParticipantsInConference(conference, false);
            ConferenceServiceMock.Setup(c => c.GetConference(conference.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(conference);
            await Hub.ToggleParticipantLocalMute(conferenceId, participant.Id, isLocalMuted);

            EventHubClientMock.Verify(
                x => x.Group(participant.Username.ToLowerInvariant())
                    .UpdateParticipantLocalMuteMessage(conferenceId, participant.Id, isLocalMuted), Times.Once);
        }

        [Test]
        public async Task should_not_publish_when_participant_does_not_exist()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername, true);
            var conferenceId = conference.Id;
            var participantId = Guid.NewGuid();
            var localMute = true;
            
            ConferenceServiceMock.Setup(c => c.GetConference(conference.Id, It.IsAny<CancellationToken>())).ReturnsAsync(conference);
            await Hub.ToggleParticipantLocalMute(conferenceId, participantId, localMute);

            EventHubClientMock.Verify(
                x => x.Group(It.IsAny<string>())
                    .UpdateParticipantLocalMuteMessage(participantId, conference.Id, localMute), Times.Never);
        }
    }
}
