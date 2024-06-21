using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Hub
{
    public class TransferRequestTests : EventHubBaseTests
    {
        [Test]
        public async Task Should_Send_TransferRequest_To_VhoOfficers_Group_And_Judge()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername);
            var participant = conference.Participants.First(x => x.Username == participantUsername);
            
            var conferenceId = conference.Id;
            var participantId = participant.Id;
            var transferDirection = TransferDirection.In;

            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            SetupEventHubClientsForAllParticipantsInConference(conference, true);
            
            await Hub.SendTransferRequest(conferenceId, participantId, transferDirection);

            foreach (var p in conference.Participants)
            {
                EventHubClientMock.Verify(
                    x => x.Group(p.Username.ToLowerInvariant())
                        .HearingTransfer(conferenceId, participantId, transferDirection), Times.Once);
            }
            
            EventHubClientMock.Verify(
                x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName)
                    .HearingTransfer(conferenceId, participantId, transferDirection), Times.Once);
        }

        [Test]
        public async Task Should_Throw_ParticipantNotFoundException_With_Random_ParticipantId()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername);

            var conferenceId = conference.Id;
            var participantId = Guid.NewGuid();
            var transferDirection = TransferDirection.In;
            
            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            SetupEventHubClientsForAllParticipantsInConference(conference, true);
            
            await Hub.SendTransferRequest(conferenceId, participantId, transferDirection);
            
            foreach (var p in conference.Participants)
            {
                EventHubClientMock.Verify(
                    x => x.Group(p.Username.ToLowerInvariant())
                        .HearingTransfer(conferenceId, participantId, transferDirection), Times.Never);
            }
            
            EventHubClientMock.Verify(
                x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName)
                    .HearingTransfer(conferenceId, participantId, transferDirection), Times.Never);
        }
        
        [Test]
        public async Task Should_Throw_ParticipantNotFoundException_With_No_ParticipantId()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername);

            var conferenceId = conference.Id;
            var participantId = Guid.Empty;
            var transferDirection = TransferDirection.In;
            
            ConferenceCacheMock.Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);
            
            SetupEventHubClientsForAllParticipantsInConference(conference, true);
            
            await Hub.SendTransferRequest(conferenceId, participantId, transferDirection);
            
            foreach (var p in conference.Participants)
            {
                EventHubClientMock.Verify(
                    x => x.Group(p.Username.ToLowerInvariant())
                        .HearingTransfer(conferenceId, participantId, transferDirection), Times.Never);
            }
            
            EventHubClientMock.Verify(
                x => x.Group(EventHub.Hub.EventHub.VhOfficersGroupName)
                    .HearingTransfer(conferenceId, participantId, transferDirection), Times.Never);
        }
    }
}
