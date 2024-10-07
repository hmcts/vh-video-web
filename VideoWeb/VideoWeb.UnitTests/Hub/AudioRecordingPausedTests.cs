using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Hub;

public class AudioRecordingPausedTests: EventHubBaseTests
{
    [Test]
    public async Task should_publish_audio_recording_paused()
    {
        var conference = CreateTestConference("individual@hmcts.net");
        var conferenceId = conference.Id;
        var hostThatActionedEvent = conference.Participants.First(x => x.IsHost());
        var hosts = conference.Participants.Skip(1).Where(x => x.IsHost()).ToList();
        SetupEventHubClientsForAllParticipantsInConference(conference, false);
        ConferenceServiceMock.Setup(c => c.GetConference(conference.Id, It.IsAny<CancellationToken>())).ReturnsAsync(conference);

        await Hub.AudioRecordingPaused(conferenceId, hostThatActionedEvent.Id);

        foreach (var participant in hosts)
            EventHubClientMock.Verify(x => x.Group(participant.Username.ToLowerInvariant()).AudioRecordingPaused(conferenceId), Times.Once);
        
        EventHubClientMock.Verify(x => x.Group(hostThatActionedEvent.Username.ToLowerInvariant()).AudioRecordingPaused(conferenceId), Times.Never);
        
    }
}
