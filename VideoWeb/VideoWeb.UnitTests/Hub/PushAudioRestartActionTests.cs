using System;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Hub;

public class PushAudioRestartActionTests: EventHubBaseTests
{
    [Test]
    public async Task should_publish_audio_restart_actioned()
    {
        var conference = CreateTestConference("individual@hmcts.net");
        var conferenceId = conference.Id;
        var hostThatActionedEvent = conference.Participants.First(x => x.IsHost());
        var hosts = conference.Participants.Skip(1).Where(x => x.IsHost()).ToList();
        SetupEventHubClientsForAllParticipantsInConference(conference, false);
        ConferenceServiceMock.Setup(c => c.GetConference(conference.Id)).ReturnsAsync(conference);

        await Hub.PushAudioRestartAction(conferenceId, hostThatActionedEvent.Id);

        foreach (var participant in hosts)
            EventHubClientMock.Verify(x => x.Group(participant.Username.ToLowerInvariant()).AudioRestartActioned(conferenceId), Times.Once);
        
        EventHubClientMock.Verify(x => x.Group(hostThatActionedEvent.Username.ToLowerInvariant()).AudioRestartActioned(conferenceId), Times.Never);
        
    }
}
