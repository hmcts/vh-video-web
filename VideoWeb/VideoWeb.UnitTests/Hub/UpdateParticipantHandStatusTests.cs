using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.EventHub.Exceptions;

namespace VideoWeb.UnitTests.Hub
{
    public class UpdateParticipantHandStatusTests : EventHubBaseTests
    {
        [Test]
        public void should_capture_exception_and_log_it()
        {
            // arrange
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            ConferenceManagementServiceMock.Setup(x =>
                    x.UpdateParticipantHandStatusInConference(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new ParticipantNotFoundException(conferenceId, participantId));

            // act / assert
            Func<Task> action = async () => await Hub.UpdateParticipantHandStatus(conferenceId, participantId, false);
            action.Should().NotThrowAsync<ParticipantNotFoundException>();
        }
        
        [Test]
        public async Task should_invoke_conference_management_service()
        {
            var participantUsername = "individual@hmcts.net";
            var conference = CreateTestConference(participantUsername, true);
            var conferenceId = conference.Id;
            var participantId = Guid.NewGuid();
            const bool handRaised = true;
            
            await Hub.UpdateParticipantHandStatus(conferenceId, participantId, handRaised);

            ConferenceManagementServiceMock.Verify(
                x => x.UpdateParticipantHandStatusInConference(conferenceId, participantId, handRaised,
                    It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
