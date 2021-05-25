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
using BookingsApi.Contract.Responses;
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
        public async Task<IActionResult> SendInternalEventAsync(string conferenceId, string participantId)
        {
            _logger.LogDebug("");
            try
            {
                var _conferenceId = Guid.Parse(conferenceId);
                var conference = await _conferenceCache.GetOrAddConferenceAsync(_conferenceId, () =>
                {
                    _logger.LogTrace("Retrieving conference details for conference: {ConferenceId}", _conferenceId);
                    return _videoApiClient.GetConferenceDetailsByIdAsync(_conferenceId);
                });

                // var participantAdded = 

                foreach (var participant in conference.Participants)
                {
                    await HubContext.Clients.Group(participant.Username.ToLowerInvariant())
                        .ParticipantAdded(_conferenceId, new ParticipantResponse());
                    _logger.LogTrace("{UserName} | Role: {Role}", participant.Username,
                        participant.Role);
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
    }
}
