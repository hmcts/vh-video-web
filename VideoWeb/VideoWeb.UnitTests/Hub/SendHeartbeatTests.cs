using System;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Hub
{
    public class SendHeartbeatTests : EventHubBaseTests
    {
        [Test]
        public async Task Should_send_heartbeat_to_vhofficers_group()
        {
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            var heartbeat = new Heartbeat
            {
                HearingId = conferenceId, ParticipantId = participantId,
                BrowserName = "test_browser", BrowserVersion = "1",
                IncomingAudioPercentageLostRecent = 10.3m
            };
            
            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName)).Returns(mockClient.Object);
            HeartbeatMapper.Setup(x => x.MapToHealth(heartbeat)).Returns(HeartbeatHealth.Good);
            var addHeartbeatRequest = new AddHeartbeatRequest
            {
                Browser_name = heartbeat.BrowserName, Browser_version = heartbeat.BrowserVersion,
                Incoming_audio_percentage_lost_recent = 10.3
            };
            HeartbeatMapper.Setup(x => x.MapToRequest(heartbeat)).Returns(addHeartbeatRequest);
            await Hub.SendHeartbeat(conferenceId, participantId, heartbeat);

            mockClient.Verify
            (
                x => x.ReceiveHeartbeat
                (
                    conferenceId, participantId, HeartbeatHealth.Good, heartbeat.BrowserName, heartbeat.BrowserVersion
                ), 
                Times.Once
            );
            
            VideoApiClientMock.Verify
            (
                x => x.SaveHeartbeatDataForParticipantAsync(conferenceId, participantId, addHeartbeatRequest), 
                Times.Once
            );
        }
        
        [Test]
        public async Task Should_throw_error_on_send_heartbeat()
        {
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            var heartbeat = new Heartbeat
            {
                HearingId = conferenceId, ParticipantId = participantId,
                BrowserName = "test_browser", BrowserVersion = "1",
                IncomingAudioPercentageLostRecent = 10.3m
            };
            
            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName)).Returns(mockClient.Object);
            HeartbeatMapper.Setup(x => x.MapToHealth(heartbeat)).Returns(HeartbeatHealth.Good);
            mockClient.Setup
            (
                x => x.ReceiveHeartbeat(conferenceId, participantId, 
                    HeartbeatHealth.Good, heartbeat.BrowserName, heartbeat.BrowserVersion)
            ).Throws<Exception>();
            
            var addHeartbeatRequest = new AddHeartbeatRequest
            {
                Browser_name = heartbeat.BrowserName, Browser_version = heartbeat.BrowserVersion,
                Incoming_audio_percentage_lost_recent = 10.3
            };
            HeartbeatMapper.Setup(x => x.MapToRequest(heartbeat)).Returns(addHeartbeatRequest);
            await Hub.SendHeartbeat(conferenceId, participantId, heartbeat);

            VideoApiClientMock.Verify
            (
                x => x.SaveHeartbeatDataForParticipantAsync(conferenceId, participantId, addHeartbeatRequest), 
                Times.Never
            );
        }
    }
}
