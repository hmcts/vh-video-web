using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Hub
{
    public class SendMediaDeviceStatusTests : EventHubBaseTests
    {
        [Test]
        public async Task should_publish_media_status_to_participants_and_admin_when_ids_are_valid()
        {
            var participantUsername = "individual@test.com";
            var conference = CreateTestConference(participantUsername);

            var conferenceId = conference.Id;
            var participant = conference.Participants.First(x => x.Username == participantUsername);
            var deviceStatus = new ParticipantMediaStatus
            {
                IsLocalMuted = true
            };
            var participantCount = conference.Participants.Count + 1; // include the VHO group

            SetupEventHubClientsForAllParticipantsInConference(conference, true);

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            await Hub.SendMediaDeviceStatus(conferenceId, participant.Id, deviceStatus);
            EventHubClientMock.Verify(
                x => x.Group(It.IsAny<string>())
                    .ParticipantMediaStatusMessage(conferenceId, participant.Id, deviceStatus),
                Times.Exactly(participantCount));
        }

        [Test]
        public async Task should_not_publish_media_status_when_participant_id_does_not_exist()
        {
            var participantUsername = "individual@test.com";
            var conference = CreateTestConference(participantUsername);

            var conferenceId = conference.Id;
            var participantId = Guid.NewGuid();
            var deviceStatus = new ParticipantMediaStatus
            {
                IsLocalMuted = true
            };
            
            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            await Hub.SendMediaDeviceStatus(conferenceId, participantId, deviceStatus);
            EventHubClientMock.Verify(
                x => x.Group(It.IsAny<string>())
                    .ParticipantMediaStatusMessage(conferenceId, participantId, deviceStatus), Times.Never);
        }
    }
}
