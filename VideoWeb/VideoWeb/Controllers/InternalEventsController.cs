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
using VideoWeb.Extensions;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideoApi.Client;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using EndpointState = VideoWeb.EventHub.Enums.EndpointState;
using EventType = VideoWeb.EventHub.Enums.EventType;
using ParticipantState = VideoWeb.EventHub.Enums.ParticipantState;
using Task = System.Threading.Tasks.Task;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Models;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("internalevent")]
    public class InternalEventsController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IEventHandlerFactory _eventHandlerFactory;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<InternalEventsController> _logger;
        private readonly IMapperFactory _mapperFactory;

        public InternalEventsController(
            IVideoApiClient videoApiClient,
            IEventHandlerFactory eventHandlerFactory,
            IConferenceCache conferenceCache,
            ILogger<InternalEventsController> logger,
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
            var participantMapper = _mapperFactory.Get<ParticipantRequest, Participant>(); //TODO inject directly?? Or create in constructor?
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
