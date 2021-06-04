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
        
        protected readonly IHubContext<EventHub.Hub.EventHub, IEventHubClient> HubContext;

        public InternalEventsController(
            IVideoApiClient videoApiClient,
            IEventHandlerFactory eventHandlerFactory,
            IConferenceCache conferenceCache,
            ILogger<InternalEventsController> logger,
            IMapperFactory mapperFactory,
            IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
            HubContext = hubContext;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "InternalEvent")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SendInternalEventAsync(InternalEvent request)
        {
            _logger.LogDebug("");
            try
            {
                var conferenceId = request.ConferenceId;
                var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, () =>
                {
                    _logger.LogTrace("Retrieving conference details for conference: {ConferenceId}", conferenceId);
                    return _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
                });

                var participantMapper = _mapperFactory.Get<ParticipantRequest, Participant>(); //TODO inject directly?? Or create in constructor?

                //request.AddParticipantsToConferenceRequest.Participants.Select(participant => {
                //    return participantMapper.Map(participant);
                //}).ToList().ForEach(participant =>

                foreach(var participant in request.AddParticipantsToConferenceRequest.Participants)
                {
                    var mapped = participantMapper.Map(participant);
                    conference.AddParticipant(mapped);
                };

                await _conferenceCache.UpdateConferenceAsync(conference);

                foreach (var participant in request.AddParticipantsToConferenceRequest.Participants)
                {
                    var mapped = participantMapper.Map(participant);
                    CallbackEvent callbackEvent = new CallbackEvent() { ConferenceId = conferenceId, EventType = request.EventType, ParticipantId = Guid.Empty, TimeStampUtc = request.TimeStampUtc, ParticipantAdded = mapped }; // TODO remove new Guid

                    await PublishEventToUi(callbackEvent);
                };

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}", request.ConferenceId,
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
