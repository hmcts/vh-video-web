using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Hub
{
    public class SendMediaDeviceStatusTests : EventHubBaseTests
    {
        [Test]
        public async Task should_publish_media_status_to_participants_hosts_and_admin_when_ids_are_valid()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername);

            var conferenceId = conference.Id;
            var participant = conference.Participants.First(x => x.Username == participantUsername);
            var deviceStatus = new ParticipantMediaStatus
            {
                IsLocalAudioMuted = true,
                IsLocalVideoMuted = false
            };

            SetupEventHubClientsForAllParticipantsInConference(conference, true);
            
            ConferenceServiceMock.Setup(c => c.GetConference(conference.Id)).ReturnsAsync(conference);

            await Hub.SendMediaDeviceStatus(conferenceId, participant.Id, deviceStatus);
            
            VerifyMessageCallCount(conference, participant.Id, deviceStatus, Times.Once());
            ConferenceVideoControlStatusService.Verify(
                x => x.UpdateMediaStatusForParticipantInConference(conferenceId, participant.Id.ToString(),
                    deviceStatus), Times.Once);
        }

        [Test]
        public async Task should_not_publish_media_status_when_participant_id_does_not_exist()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername);

            var conferenceId = conference.Id;
            var participantId = Guid.NewGuid();
            var deviceStatus = new ParticipantMediaStatus
            {
                IsLocalAudioMuted = false,
                IsLocalVideoMuted = true
            };
            ConferenceServiceMock.Setup(c => c.GetConference(conference.Id)).ReturnsAsync(conference);
            await Hub.SendMediaDeviceStatus(conferenceId, participantId, deviceStatus);

            VerifyMessageCallCount(conference, participantId, deviceStatus, Times.Never());
        }

        private void VerifyMessageCallCount(ConferenceDto conferenceDto, Guid participantId, ParticipantMediaStatus message,
            Times times)
        {
            var judge = conferenceDto.Participants.Single(x => x.IsJudge());
            EventHubClientMock.Verify(
                x => x.Group(judge.Username.ToLowerInvariant())
                    .ParticipantMediaStatusMessage(participantId, conferenceDto.Id,
                        It.Is<ParticipantMediaStatus>(s =>
                            s.IsLocalAudioMuted == message.IsLocalAudioMuted &&
                            s.IsLocalVideoMuted == message.IsLocalVideoMuted)), times);

            var staffMember = conferenceDto.Participants.Single(x => x.IsStaffMember());
            EventHubClientMock.Verify(
                x => x.Group(staffMember.Username.ToLowerInvariant())
                    .ParticipantMediaStatusMessage(participantId, conferenceDto.Id,
                        It.Is<ParticipantMediaStatus>(s =>
                            s.IsLocalAudioMuted == message.IsLocalAudioMuted &&
                            s.IsLocalVideoMuted == message.IsLocalVideoMuted)), times);


            EventHubClientMock.Verify(
                x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName)
                    .ParticipantMediaStatusMessage(participantId, conferenceDto.Id, message), times);
        }
    }
}
