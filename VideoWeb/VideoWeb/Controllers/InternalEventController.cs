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
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;

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

        [HttpPost("ParticipantsUpdated")]
        [SwaggerOperation(OperationId = "ParticipantsUpdated")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> ParticipantsUpdated(Guid conferenceId, UpdateConferenceParticipantsRequest request)
        {
            _logger.LogDebug("ParticipantsUpdated called. ConferenceId: {ConferenceId}", conferenceId);

            var participantsUpdatedMapper = _mapperFactory.Get<UpdateConferenceParticipantsRequest, ParticipantsUpdated>();
            var participantsMapper = _mapperFactory.Get<Participant, ParticipantResponse>();

            try
            {
                var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, () =>
                {
                    _logger.LogTrace("Retrieving conference details for conference: {ConferenceId}", conferenceId);
                    return _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
                });

                // TODO refactor out of controller
                var mapper = _mapperFactory.Get<ParticipantRequest, Participant>();
                request.NewParticipants.ToList().ForEach(participant =>
                {
                    var mappedParticipant = mapper.Map(participant);
                    conference.AddParticipant(mappedParticipant);
                });

                request.RemovedParticipants.ToList().ForEach(referenceId =>
                {
                    conference.RemoveParticipant(referenceId);
                });

                request.ExistingParticipants.ToList().ForEach(updateRequest =>
                {
                    conference.UpdateParticipant(updateRequest);
                });


                CallbackEvent callbackEvent = new CallbackEvent() 
                { 
                    ConferenceId = conferenceId, 
                    EventType = EventType.ParticipantsUpdated, 
                    TimeStampUtc = DateTime.UtcNow,
                    Participants = conference.Participants.Select(x => participantsMapper.Map(x)).ToList()
                };

                await _conferenceCache.UpdateConferenceAsync(conference);

                await PublishEventToUi(callbackEvent);
                
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
