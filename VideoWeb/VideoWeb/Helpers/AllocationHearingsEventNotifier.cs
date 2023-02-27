using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.Helpers
{
    public class AllocationHearingsEventNotifier: IAllocationHearingsEventNotifier
    {     
        private readonly IEventHandlerFactory _eventHandlerFactory;
        private readonly IMapperFactory _mapperFactory;
        private readonly ILogger<AllocationHearingsEventNotifier> _logger;

        public AllocationHearingsEventNotifier(IEventHandlerFactory eventHandlerFactory, 
            IMapperFactory mapperFactory, ILogger<AllocationHearingsEventNotifier> logger)
        {
            _eventHandlerFactory = eventHandlerFactory;
            _mapperFactory = mapperFactory;
            _logger = logger;
        }
        
        public Task PushAllocationHearingsEvent(string csoUserName, IList<HearingDetailRequest> hearings)
        {
            CallbackEvent callbackEvent = new CallbackEvent()
            {
                EventType = EventType.AllocationHearings,
                TimeStampUtc = DateTime.UtcNow,
                AllocatedHearingsDetails = hearings.ToList(),
                CsoAllocatedUserName = csoUserName
            };

            _logger.LogTrace($"Publishing event to UI: {JsonSerializer.Serialize(callbackEvent)}");
            return PublishEventToUi(callbackEvent);
        }

        private Task PublishEventToUi(CallbackEvent callbackEvent)
        {
            if (callbackEvent == null)
            {
                return Task.CompletedTask;
            }

            var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
            
            return handler.HandleAsync(callbackEvent);
        }
    }
}
