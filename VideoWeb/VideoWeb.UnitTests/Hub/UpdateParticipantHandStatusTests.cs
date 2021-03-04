using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Hub
{
    public class UpdateParticipantHandStatusTests : EventHubBaseTests
    {
        [Test]
        public async Task should_publish_hand_raised_to_participants_and_linked_and_judge()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername, true);
            var conferenceId = conference.Id;
            var participant = conference.Participants.First(x => x.Username == participantUsername);
            var handRaised = true;

            SetupEventHubClientsForAllParticipantsInConference(conference, false);

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            await Hub.UpdateParticipantHandStatus(conferenceId, participant.Id, handRaised);
            
            
            var judge = conference.Participants.Single(x => x.IsJudge());
            EventHubClientMock.Verify(
                x => x.Group(judge.Username.ToLowerInvariant())
                    .ParticipantHandRaiseMessage(participant.Id, conference.Id, handRaised),  Times.Once);
            
            EventHubClientMock.Verify(
                x => x.Group(participant.Username.ToLowerInvariant())
                    .ParticipantHandRaiseMessage(participant.Id, conference.Id, handRaised), Times.Once);

            foreach (var lp in participant.LinkedParticipants)
            {
                var linkedPat = conference.Participants.Single(p => p.Id == lp.LinkedId);
                EventHubClientMock.Verify(
                    x => x.Group(linkedPat.Username.ToLowerInvariant())
                        .ParticipantHandRaiseMessage(participant.Id, conference.Id, handRaised), Times.Once);
            }
        }

        [Test]
        public async Task should_not_send_message_when_participant_does_not_exist()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername, true);
            var conferenceId = conference.Id;
            var participantId = Guid.NewGuid();
            var handRaised = true;
            
            SetupEventHubClientsForAllParticipantsInConference(conference, false);

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            await Hub.UpdateParticipantHandStatus(conferenceId, participantId, handRaised);
            
            EventHubClientMock.Verify(
                x => x.Group(It.IsAny<string>())
                    .ParticipantHandRaiseMessage(participantId, conference.Id, handRaised), Times.Never);
        }
    }
}
