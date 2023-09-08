using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;
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
                    x.UpdateParticipantHandStatusInConference(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<bool>()))
                .ThrowsAsync(new ParticipantNotFoundException(conferenceId, participantId));

            // act / assert
            Func<Task> action = async () => await Hub.UpdateParticipantHandStatus(conferenceId, participantId, false);
            action.Should().NotThrow<ParticipantNotFoundException>();
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
            
            ConferenceManagementServiceMock.Verify(x => x.UpdateParticipantHandStatusInConference(conferenceId, participantId, handRaised), Times.Once);
        }
    }
}
