using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Exceptions;

namespace VideoWeb.EventHub.Handlers;

public class TelephoneTransferEventHandler(
    IHubContext<Hub.EventHub, IEventHubClient> hubContext,
    IConferenceService conferenceService,
    ILogger<EventHandlerBase> logger)
    : EventHandlerBase(hubContext, conferenceService, logger)
{
    private readonly IConferenceService _conferenceService = conferenceService;

    public override EventType EventType => EventType.TelephoneTransfer;

    protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
    {
        var room = DeriveRoomForTransferEvent(callbackEvent);
        if (SourceTelephoneParticipant != null)
        {
            ValidateTelephoneParticipantEventReceivedAfterLastUpdate(callbackEvent);
            SourceTelephoneParticipant.UpdateRoom(room);
            SourceTelephoneParticipant.LastEventTime = callbackEvent.TimeStampUtc;
            await _conferenceService.UpdateConferenceAsync(SourceConference);
        }
    }
    
    private static RoomType DeriveRoomForTransferEvent(CallbackEvent callbackEvent)
    {
        var isRoomToEnum = Enum.TryParse<RoomType>(callbackEvent.TransferTo, out var transferTo);
        if (!isRoomToEnum && transferTo != RoomType.HearingRoom && transferTo != RoomType.WaitingRoom)
        {
            throw new RoomTransferException(callbackEvent.TransferFrom, callbackEvent.TransferTo);
        }

        return transferTo;
    }
}
