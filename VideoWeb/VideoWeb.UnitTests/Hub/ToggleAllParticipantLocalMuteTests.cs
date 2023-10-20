using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Hub
{
    public class ToggleAllParticipantLocalMuteTests : EventHubBaseTests
    {
        [Test]
        public async Task should_publish_requested_local_mute_status()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername, true);
            var conferenceId = conference.Id;
            var isLocalMuted = true;
            var nonHostParticipants = conference.Participants.Where(x => !x.IsHost()).ToList();

            SetupEventHubClientsForAllParticipantsInConference(conference, false);

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            await HubPr2079.ToggleAllParticipantLocalMute(conferenceId, isLocalMuted);

            foreach (var participant in nonHostParticipants)
            {
                EventHubClientMock.Verify(
                    x => x.Group(participant.Username.ToLowerInvariant())
                        .UpdateParticipantLocalMuteMessage(conferenceId, participant.Id, isLocalMuted), Times.Once);
            }
        }
    }
}
