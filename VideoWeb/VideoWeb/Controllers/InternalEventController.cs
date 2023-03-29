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
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using System.Text.Json;
using VideoApi.Contract.Responses;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.InternalHandlers.Core;
using VideoWeb.EventHub.InternalHandlers.Models;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("internalevent")]
    [Authorize(AuthenticationSchemes = "InternalEvent")]
    [ApiExplorerSettings(IgnoreApi = false)]
    [AllowAnonymous]
    public class InternalEventController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<InternalEventController> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IInternalEventHandlerFactory _internalEventHandlerFactory;

        public InternalEventController(
            IVideoApiClient videoApiClient,
            IConferenceCache conferenceCache,
            ILogger<InternalEventController> logger,
            IMapperFactory mapperFactory,
            IInternalEventHandlerFactory internalEventHandlerFactory)
        {
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _internalEventHandlerFactory = internalEventHandlerFactory;
        }

        [HttpPost("ConferenceAdded")]
        [SwaggerOperation(OperationId = "ConferenceAdded")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> ConferenceAdded(Guid conferenceId)
        {
            var eventDto = new NewConferenceAddedEventDto()
            {
                ConferenceId = conferenceId
            };
            var handler = _internalEventHandlerFactory.Get(eventDto);
            await handler.HandleAsync(eventDto);
            return NoContent();
        }

        [HttpPost("ParticipantsUpdated")]
        [SwaggerOperation(OperationId = "ParticipantsUpdated")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> ParticipantsUpdated(Guid conferenceId, UpdateConferenceParticipantsRequest request)
        {
            _logger.LogDebug($"ParticipantsUpdated called. ConferenceId: {conferenceId}, Request {JsonSerializer.Serialize(request)}");

            var requestToParticipantMapper = _mapperFactory.Get<ParticipantRequest, IEnumerable<Participant>, Participant>();
            var updateParticipantRequestToUpdateParticipantMapper = _mapperFactory.Get<UpdateParticipantRequest, IEnumerable<Participant>, UpdateParticipant>();

            try
            {
                var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, () =>
                {
                    _logger.LogTrace("Retrieving conference details for conference: {ConferenceId}", conferenceId);
                    return _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
                });

                _logger.LogTrace($"Initial conference details: {conference}");

                request.NewParticipants.ToList().ForEach(participant =>
                {
                    _logger.LogTrace($"Mapping new participant: {JsonSerializer.Serialize(participant)}");
                    var mappedParticipant = requestToParticipantMapper.Map(participant, conference.Participants);
                    _logger.LogTrace($"Adding participant to conference: {JsonSerializer.Serialize(mappedParticipant)}");
                    conference.AddParticipant(mappedParticipant);
                });

                var removedParticipants = conference.Participants.Where(p => request.RemovedParticipants.Contains(p.Id)).ToList();

                request.RemovedParticipants.ToList().ForEach(referenceId =>
                {
                    _logger.LogTrace($"Removing participant from conference. ReferenceID: {referenceId}");
                    conference.RemoveParticipant(referenceId);
                });

                request.ExistingParticipants.ToList().ForEach(updateRequest =>
                {
                    _logger.LogTrace($"Mapping existing participant update: {JsonSerializer.Serialize(updateRequest)}");
                    var mappedUpdateParticipant = updateParticipantRequestToUpdateParticipantMapper.Map(updateRequest, conference.Participants);
                    _logger.LogTrace($"Updating existing participant in conference: {JsonSerializer.Serialize(mappedUpdateParticipant)}");
                    conference.UpdateParticipant(mappedUpdateParticipant);
                });

                _logger.LogTrace($"Updating conference in cache: {JsonSerializer.Serialize(conference)}");
                await _conferenceCache.UpdateConferenceAsync(conference);

                var participantsToNotify = conference.Participants.Union(removedParticipants).ToList();
                var participantsToResponseMapper = _mapperFactory.Get<Participant, Conference, Contract.Responses.ParticipantResponse>();
                
                var eventDto = new ParticipantsUpdatedEventDto
                {
                    ConferenceId = conferenceId,
                    Participants = conference.Participants.Select(participant => participantsToResponseMapper.Map(participant, conference)).ToList()
                };
                var handler = _internalEventHandlerFactory.Get(eventDto);
                await handler.HandleAsync(eventDto);
                
                _logger.LogDebug($"ParticipantsUpdated finished. ConferenceId: {conferenceId}");
                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}", conferenceId,
                    e.StatusCode);
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("UpdatedAllocation")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> AllocationUpdated(AllocationUpdatedRequest request)
        {
            // optional
            // request.Conferences.ForEach(async x => await _conferenceCache.AddConferenceAsync(x));

            var mapper = _mapperFactory.Get<ConferenceDetailsResponse, Conference>();
            var conferences = request.Conferences.Select(mapper.Map).ToList();
            var eventDto = new AllocationUpdatedEventDto
            {
                CsoUsername = request.AllocatedCsoUsername,
                Conferences = conferences
            };
            var handler = _internalEventHandlerFactory.Get(eventDto);
            await handler.HandleAsync(eventDto);

            return NoContent();
        }

    }
}
