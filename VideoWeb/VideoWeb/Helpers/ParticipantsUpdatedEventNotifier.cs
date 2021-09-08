using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.Helpers
{
    public class ParticipantsUpdatedEventNotifier: IParticipantsUpdatedEventNotifier
    {     
        private readonly IEventHandlerFactory _eventHandlerFactory;
        private readonly IMapperFactory _mapperFactory;
        private readonly ILogger<ParticipantsUpdatedEventNotifier> _logger;

        public ParticipantsUpdatedEventNotifier(IEventHandlerFactory eventHandlerFactory, IMapperFactory mapperFactory, ILogger<ParticipantsUpdatedEventNotifier> logger)
        {
            _eventHandlerFactory = eventHandlerFactory;
            _mapperFactory = mapperFactory;
            _logger = logger;
        }

        public Task PushParticipantsUpdatedEvent(Conference conference)
        {
            var participantsToResponseMapper = _mapperFactory.Get<Participant, Conference, ParticipantResponse>();
            CallbackEvent callbackEvent = new CallbackEvent()
            {
                ConferenceId = conference.Id,
                EventType = EventType.ParticipantsUpdated,
                TimeStampUtc = DateTime.UtcNow,
                Participants = conference.Participants.Select(participant => participantsToResponseMapper.Map(participant, conference)).ToList()
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
