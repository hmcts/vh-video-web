using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Hub;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Hub
{
    public class TransferRequestTests : EventHubBaseTests
    {
        [Test]
        public async Task Should_Send_TransferRequest_To_VhoOfficers_Group_And_Judge()
        {
            var participantUsername = "individual@test.com";
            var conference = InitConference(participantUsername);
            var participant = conference.Participants.First(x => x.Username == participantUsername);
            var judge = conference.Participants.First(x => x.Role == Role.Judge);
            var judgeName = judge.Username;

            var conferenceId = conference.Id;
            var participantId = participant.Id;
            var transferDirection = TransferDirection.In;

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var mockAdminClient = new Mock<IEventHubClient>();
            var mockParticipantClient = new Mock<IEventHubClient>();
            var mockJudgeClient = new Mock<IEventHubClient>();

            EventHubClientMock.Setup(x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName)).Returns(mockAdminClient.Object);
            EventHubClientMock.Setup(x => x.Group(participantUsername.ToLowerInvariant())).Returns(mockParticipantClient.Object);
            EventHubClientMock.Setup(x => x.Group(judgeName.ToLowerInvariant())).Returns(mockJudgeClient.Object);
                
            await Hub.SendTransferRequest(conferenceId, participantId, transferDirection);

            mockAdminClient.Verify
            (
                x => x.HearingTransfer
                (
                    conferenceId, participantId, transferDirection
                ),
                Times.Once
            );

            mockParticipantClient.Verify
            (
                x => x.HearingTransfer
                (
                    conferenceId, participantId, transferDirection
                ),
                Times.Once
            );

            mockJudgeClient.Verify
            (
                x => x.HearingTransfer
                (
                    conferenceId, participantId, transferDirection
                ),
                Times.Once
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
