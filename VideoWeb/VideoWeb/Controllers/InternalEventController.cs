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
        private readonly IAllocationHearingsEventNotifier _allocationHearingsEventNotifier;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<InternalEventController> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly INewConferenceAddedEventNotifier _newConferenceAddedEventNotifier;

        public InternalEventController(
            IVideoApiClient videoApiClient,
            IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier,
            IConferenceCache conferenceCache,
            ILogger<InternalEventController> logger,
            IMapperFactory mapperFactory,
            INewConferenceAddedEventNotifier newConferenceAddedEventNotifier,
            IAllocationHearingsEventNotifier allocationHearingsEventNotifier)
        {
            _videoApiClient = videoApiClient;
            _participantsUpdatedEventNotifier = participantsUpdatedEventNotifier;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _newConferenceAddedEventNotifier = newConferenceAddedEventNotifier;
            _allocationHearingsEventNotifier = allocationHearingsEventNotifier;
        }

        [HttpPost("ConferenceAdded")]
        [SwaggerOperation(OperationId = "ConferenceAdded")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> ConferenceAdded(Guid conferenceId)
        {
            await _newConferenceAddedEventNotifier.PushNewConferenceAddedEvent(conferenceId);
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

                await _participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference, participantsToNotify);
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

        [HttpPost("AllocationHearings")]
        [SwaggerOperation(OperationId = "AllocationHearings")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> AllocationHearings(AllocationHearingsToCsoRequest request)
        {
            try
            {
                _logger.LogDebug($"AllocationHearings called. Request {JsonSerializer.Serialize(request)}");

                var csoToNotify = request.AllocatedCsoUserName;
                var hearings = request.HearingsRequest;
                
                await _allocationHearingsEventNotifier.PushAllocationHearingsEvent(csoToNotify, hearings);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"HearingIds: {JsonSerializer.Serialize(request)}, ErrorCode: {e.StatusCode}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
