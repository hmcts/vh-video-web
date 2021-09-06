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
using System.Text.Json;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("internalevent")]
    [Authorize(AuthenticationSchemes = "InternalEvent")]
    public class InternalEventController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IParticipantsUpdatedEventNotifier _participantsUpdatedEventNotifier;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<InternalEventController> _logger;
        private readonly IMapperFactory _mapperFactory;

        public InternalEventController(
            IVideoApiClient videoApiClient,
            IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier,
            IConferenceCache conferenceCache,
            ILogger<InternalEventController> logger,
            IMapperFactory mapperFactory)
        {
            _videoApiClient = videoApiClient;
            _participantsUpdatedEventNotifier = participantsUpdatedEventNotifier;
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
            _logger.LogDebug($"ParticipantsUpdated called. ConferenceId: {conferenceId}, Request {JsonSerializer.Serialize(request)}");

            var requestToParticipantMapper = _mapperFactory.Get<ParticipantRequest, IEnumerable<Participant>, Participant>();
            var updateParticipantRequestToUpdateParticipantMapper = _mapperFactory.Get<UpdateParticipantRequest, IEnumerable<Participant>, UpdateParticipant>();
            var participantsToResponseMapper = _mapperFactory.Get<Participant, Conference, ParticipantResponse>();

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

                await _participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference);
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
    }

    
}
