using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Handlers;

public class TelephoneDisconnectedEventHandler(
    IHubContext<Hub.EventHub, IEventHubClient> hubContext,
    IConferenceService conferenceService,
    ILogger<EventHandlerBase> logger)
    : EventHandlerBase(hubContext, conferenceService, logger)
{
    private readonly IConferenceService _conferenceService = conferenceService;

    public override EventType EventType => EventType.TelephoneDisconnected;

    protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
    {
        ValidateTelephoneParticipantEventReceivedAfterLastUpdate(callbackEvent);
        SourceConference.RemoveTelephoneParticipant(callbackEvent.ParticipantId);
        await _conferenceService.UpdateConferenceAsync(SourceConference);
    }
}
