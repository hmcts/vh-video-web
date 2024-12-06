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
        var hosts = conference.Participants.Where(x => x.IsHost()).ToList();
        SetupEventHubClientsForAllParticipantsInConference(conference, false);

        ConferenceServiceMock.Setup(c => c.GetConference(conference.Id, It.IsAny<CancellationToken>())).ReturnsAsync(conference);

        await HubVih11189.SendAudioRecordingPaused(conferenceId, true);

        foreach (var participant in hosts)
            EventHubClientMock.Verify(x => x.Group(participant.Username.ToLowerInvariant()).AudioRecordingPaused(conferenceId, true), Times.Once);
    }
}
