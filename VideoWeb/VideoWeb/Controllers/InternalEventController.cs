using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using EventType = VideoWeb.EventHub.Enums.EventType;
using Task = System.Threading.Tasks.Task;


namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("internalevent")]
    [Authorize(AuthenticationSchemes = "InternalEvent")]
    public class InternalEventController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IEventHandlerFactory _eventHandlerFactory;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<InternalEventController> _logger;
        private readonly IMapperFactory _mapperFactory;

        public InternalEventController(
            IVideoApiClient videoApiClient,
            IEventHandlerFactory eventHandlerFactory,
            IConferenceCache conferenceCache,
            ILogger<InternalEventController> logger,
            IMapperFactory mapperFactory)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
        }

        [HttpPost("ParticipantsAdded")]
        [SwaggerOperation(OperationId = "ParticipantsAdded")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> ParticipantsAdded(Guid conferenceId, AddParticipantsToConferenceRequest request)
        {
            var participantMapper = _mapperFactory.Get<ParticipantRequest, Participant>();
            List<Participant> participantsAdded = request.Participants.Select(participant => participantMapper.Map(participant)).ToList();

            try
            {
                var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, () =>
                {
                    _logger.LogTrace("Retrieving conference details for conference: {ConferenceId}", conferenceId);
                    return _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
                });
                _logger.LogDebug("ParticipantsAdded called. ConferenceId: {ConferenceId}, ParticipantCount: {ParticipantCount}",
                    conferenceId, request.Participants.Count);

                
                foreach (var participant in participantsAdded)
                {
                    conference.AddParticipant(participant);
                }

                await _conferenceCache.UpdateConferenceAsync(conference);

                
                foreach (var participant in participantsAdded)
                {
                    CallbackEvent callbackEvent = new CallbackEvent() 
                    { 
                        ConferenceId = conferenceId, 
                        EventType = EventType.ParticipantAdded, 
                        TimeStampUtc = DateTime.UtcNow, 
                        ParticipantAdded = participant 
                    };

                    await PublishEventToUi(callbackEvent);
                }

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}", conferenceId,
                    e.StatusCode);
                return StatusCode(e.StatusCode, e.Response);
            }
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
