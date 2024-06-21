using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;

namespace VideoWeb.UnitTests.Hub
{
    public class SendHeartbeatTests : EventHubBaseTests
    {
        [Test]
        public async Task Should_send_heartbeat_to_vhofficers_group_and_judges()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = InitConference(participantUsername);
            var participant = conference.Participants.First(x => x.Username == participantUsername);
            var judge = conference.Participants.First(x => x.Role == Role.Judge);
            var judgeName = judge.Username;

            var conferenceId = conference.Id;
            var participantId = participant.Id;
            var heartbeat = new Heartbeat
            {
                BrowserName = "test_browser", BrowserVersion = "1",
                IncomingAudioPercentageLostRecent = 10.3m,
                OperatingSystem = "Mac OS X",
                OperatingSystemVersion = "10.15"
            };

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var mockAdminClient = new Mock<IEventHubClient>();
            var mockParticipantClient = new Mock<IEventHubClient>();
            var mockJudgeClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHubPPS2.VhOfficersGroupName)).Returns(mockAdminClient.Object);
            EventHubClientMock.Setup(x => x.Group(participantUsername.ToLowerInvariant())).Returns(mockParticipantClient.Object);
            EventHubClientMock.Setup(x => x.Group(judgeName.ToLowerInvariant())).Returns(mockJudgeClient.Object);
            HeartbeatMapper.Setup(x => x.MapToHealth(heartbeat)).Returns(HeartbeatHealth.Good);
            var addHeartbeatRequest = new AddHeartbeatRequest
            {
                BrowserName = heartbeat.BrowserName, BrowserVersion = heartbeat.BrowserVersion,
                IncomingAudioPercentageLostRecent = 10.3m
            };
            HeartbeatMapper.Setup(x => x.MapToRequest(heartbeat)).Returns(addHeartbeatRequest);
            await HubPps2.SendHeartbeat(conferenceId, participantId, heartbeat);

            mockAdminClient.Verify
            (
                x => x.ReceiveHeartbeat
                (
                    conferenceId, participantId, HeartbeatHealth.Good, heartbeat.BrowserName, heartbeat.BrowserVersion, heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion
                ), 
                Times.Once
            );

            mockParticipantClient.Verify
            (
                x => x.ReceiveHeartbeat
                (
                    conferenceId, participantId, HeartbeatHealth.Good, heartbeat.BrowserName, heartbeat.BrowserVersion,
                    heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion
                ),
                Times.Once
            );

            mockJudgeClient.Verify
            (
                x => x.ReceiveHeartbeat
                (
                    conferenceId, participantId, HeartbeatHealth.Good, heartbeat.BrowserName, heartbeat.BrowserVersion,
                    heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion
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
        public async Task Should_send_heartbeat_to_vhofficers_group_from_judge()
        {
            const string participantUsername = "individual@hmcts.net";
            var conference = InitConference(participantUsername);
            var judge = conference.Participants.First(x => x.Role == Role.Judge);
            var judgeUserName = judge.Username;

            var conferenceId = conference.Id;
            var judgeId = judge.Id;
            var heartbeat = new Heartbeat
            {
                BrowserName = "test_browser", BrowserVersion = "1",
                IncomingAudioPercentageLostRecent = 10.3m,
                OperatingSystem = "Mac OS X",
                OperatingSystemVersion = "10.15"
            };

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var mockAdminClient = new Mock<IEventHubClient>();
            var mockParticipantClient = new Mock<IEventHubClient>();
            var mockJudgeClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHubPPS2.VhOfficersGroupName)).Returns(mockAdminClient.Object);
            EventHubClientMock.Setup(x => x.Group(participantUsername.ToLowerInvariant())).Returns(mockParticipantClient.Object);
            EventHubClientMock.Setup(x => x.Group(judgeUserName.ToLowerInvariant())).Returns(mockJudgeClient.Object);
            HeartbeatMapper.Setup(x => x.MapToHealth(heartbeat)).Returns(HeartbeatHealth.Good);
            var addHeartbeatRequest = new AddHeartbeatRequest
            {
                BrowserName = heartbeat.BrowserName, BrowserVersion = heartbeat.BrowserVersion,
                IncomingAudioPercentageLostRecent = 10.3m
            };
            HeartbeatMapper.Setup(x => x.MapToRequest(heartbeat)).Returns(addHeartbeatRequest);
            await HubPps2.SendHeartbeat(conferenceId, judgeId, heartbeat);

            mockAdminClient.Verify
            (
                x => x.ReceiveHeartbeat
                (
                    conferenceId, judgeId, HeartbeatHealth.Good, heartbeat.BrowserName, heartbeat.BrowserVersion,
                    heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion
                ),
                Times.Once
            );

            mockParticipantClient.Verify
            (
                x => x.ReceiveHeartbeat
                (
                    conferenceId, judgeId, HeartbeatHealth.Good, heartbeat.BrowserName, heartbeat.BrowserVersion,
                    heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion
                ),
                Times.Never
            );

            VideoApiClientMock.Verify
            (
                x => x.SaveHeartbeatDataForParticipantAsync(conferenceId, judgeId, addHeartbeatRequest),
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
                BrowserName = "test_browser", BrowserVersion = "1",
                IncomingAudioPercentageLostRecent = 10.3m,
                OperatingSystem = "Mac OS X",
                OperatingSystemVersion = "10.15"
            };
            
            var mockClient = new Mock<IEventHubClient>();
            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHubPPS2.VhOfficersGroupName)).Returns(mockClient.Object);
            HeartbeatMapper.Setup(x => x.MapToHealth(heartbeat)).Returns(HeartbeatHealth.Good);
            mockClient.Setup
            (
                x => x.ReceiveHeartbeat(conferenceId, participantId, 
                    HeartbeatHealth.Good, heartbeat.BrowserName, heartbeat.BrowserVersion,
                    heartbeat.OperatingSystem, heartbeat.OperatingSystemVersion)
            ).Throws<Exception>();
            
            var addHeartbeatRequest = new AddHeartbeatRequest
            {
                BrowserName = heartbeat.BrowserName, BrowserVersion = heartbeat.BrowserVersion,
                IncomingAudioPercentageLostRecent = 10.3m
            };
            HeartbeatMapper.Setup(x => x.MapToRequest(heartbeat)).Returns(addHeartbeatRequest);
            await HubPps2.SendHeartbeat(conferenceId, participantId, heartbeat);

            VideoApiClientMock.Verify
            (
                x => x.SaveHeartbeatDataForParticipantAsync(conferenceId, participantId, addHeartbeatRequest), 
                Times.Never
            );
        }
        
        private Conference InitConference(string participantUsername)
        {
            var conferenceId = Guid.NewGuid();
            var participants = Builder<Participant>.CreateListOfSize(3)
                .TheFirst(1).With(x => x.Role = Role.Judge)
                .TheNext(1).With(x => x.Role = Role.Individual).With(x => x.Username = participantUsername)
                .Build().ToList();

            return Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.Participants = participants)
                .Build();
        }
    }
}
