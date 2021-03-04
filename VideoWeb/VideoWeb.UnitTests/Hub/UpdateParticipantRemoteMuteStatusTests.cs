using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Hub
{
    public class UpdateParticipantRemoteMuteStatusTests : EventHubBaseTests
    {
        [Test]
        public async Task should_publish_remote_mute_status_to_participants_and_linked()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername, true);
            var conferenceId = conference.Id;
            var participant = conference.Participants.First(x => x.Username == participantUsername);
            var isRemoteMuted = true;

            SetupEventHubClientsForAllParticipantsInConference(conference, false);

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            await Hub.UpdateParticipantRemoteMuteStatus(conferenceId, participant.Id, isRemoteMuted);

            EventHubClientMock.Verify(
                x => x.Group(participant.Username.ToLowerInvariant())
                    .ParticipantRemoteMuteMessage(participant.Id, conference.Id, isRemoteMuted), Times.Once);

            foreach (var lp in participant.LinkedParticipants)
            {
                var linkedPat = conference.Participants.Single(p => p.Id == lp.LinkedId);
                EventHubClientMock.Verify(
                    x => x.Group(linkedPat.Username.ToLowerInvariant())
                        .ParticipantRemoteMuteMessage(participant.Id, conference.Id, isRemoteMuted), Times.Once);
            }
        }

        [Test]
        public async Task should_not_publish_when_participant_does_not_exist()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername, true);
            var conferenceId = conference.Id;
            var participantId = Guid.NewGuid();
            var isRemoteMuted = true;
            
            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);
            
            await Hub.UpdateParticipantRemoteMuteStatus(conferenceId, participantId, isRemoteMuted);
            
            EventHubClientMock.Verify(
                x => x.Group(It.IsAny<string>())
                    .ParticipantRemoteMuteMessage(participantId, conference.Id, isRemoteMuted), Times.Never);
        }
    }
}
