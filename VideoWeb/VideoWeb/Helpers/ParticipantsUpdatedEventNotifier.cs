using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.Helpers
{
    public class ParticipantsUpdatedEventNotifier(
        IEventHandlerFactory eventHandlerFactory,
        ILogger<ParticipantsUpdatedEventNotifier> logger)
        : IParticipantsUpdatedEventNotifier
    {
        public Task PushParticipantsUpdatedEvent(Conference conference, IList<Participant> participantsToNotify)
        {
            CallbackEvent callbackEvent = new CallbackEvent
            {
                ConferenceId = conference.Id,
                EventType = EventType.ParticipantsUpdated,
                TimeStampUtc = DateTime.UtcNow,
                Participants = conference.Participants.Select(ParticipantDtoForResponseMapper.Map).ToList(),
                ParticipantsToNotify = participantsToNotify.Select(ParticipantDtoForResponseMapper.Map).ToList()
            };

            logger.LogTrace($"Publishing event to UI: {JsonSerializer.Serialize(callbackEvent)}");
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
}
