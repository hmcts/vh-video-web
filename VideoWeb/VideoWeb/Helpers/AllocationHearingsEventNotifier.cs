using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.Helpers;

public class AllocationHearingsEventNotifier(
    IEventHandlerFactory eventHandlerFactory,
    ILogger<AllocationHearingsEventNotifier> logger)
    : IAllocationHearingsEventNotifier
{
    public Task PushAllocationHearingsEvent(string csoUserName, IList<HearingDetailRequest> hearings)
    {
        if (!hearings.Any())
        {
            return Task.CompletedTask;
        }
        
        CallbackEvent callbackEvent = new CallbackEvent()
        {
            EventType = EventType.AllocationHearings,
            TimeStampUtc = DateTime.UtcNow,
            AllocatedHearingsDetails = hearings.ToList(),
            CsoAllocatedUserName = csoUserName
        };
        
        logger.LogTrace("Publishing event to UI: {Event}", JsonSerializer.Serialize(callbackEvent));
        return PublishEventToUi(callbackEvent);
    }
    
    private Task PublishEventToUi(CallbackEvent callbackEvent)
    {
        if (callbackEvent == null)
        {
            return Task.CompletedTask;
        }
        
        var handler = eventHandlerFactory.Get(callbackEvent.EventType);
        
        return handler.HandleAsync(callbackEvent);
    }
}
