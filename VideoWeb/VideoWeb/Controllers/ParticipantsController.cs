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
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Mappings;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using UpdateParticipantRequest = VideoWeb.Services.Video.UpdateParticipantRequest;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ParticipantsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IEventHandlerFactory _eventHandlerFactory;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<ParticipantsController> _logger;

        public ParticipantsController(IVideoApiClient videoApiClient, IEventHandlerFactory eventHandlerFactory,
            IConferenceCache conferenceCache, ILogger<ParticipantsController> logger)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _conferenceCache = conferenceCache;
            _logger = logger;
        }

        [HttpGet("{conferenceId}/participants/{participantId}/selftestresult")]
        [SwaggerOperation(OperationId = "GetTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetTestCallResultForParticipantAsync(Guid conferenceId, Guid participantId)
        {
            try
            {
                var score = await _videoApiClient.GetTestCallResultForParticipantAsync(conferenceId, participantId);

                _logger.LogTrace($"Test call result fetched successfully for " +
                                 $"conference: {conferenceId} for participant: {participantId}");
                return Ok(score);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get test call result for " +
                                    $"participant: {participantId} in conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("{conferenceId}/participantstatus")]
        [SwaggerOperation(OperationId = "UpdateParticipantStatus")]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        public async Task<IActionResult> UpdateParticipantStatusAsync(Guid conferenceId,
            UpdateParticipantStatusEventRequest updateParticipantStatusEventRequest)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, () =>
            {
                _logger.LogTrace($"Retrieving conference details for conference: ${conferenceId}");

                return _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            });
            
            var username = User.Identity.Name;
            var participantId = GetIdForParticipantByUsernameInConference(conference, username);
            var conferenceEventRequest = new ConferenceEventRequest
            {
                Conference_id = conferenceId.ToString(),
                Participant_id = participantId.ToString(),
                Event_id = Guid.NewGuid().ToString(),
                Event_type = updateParticipantStatusEventRequest.EventType,
                Time_stamp_utc = DateTime.UtcNow,
                Reason = EventTypeReasonMapper.Map(updateParticipantStatusEventRequest.EventType)
            };

            var callbackEvent =
                CallbackEventMapper.MapConferenceEventToCallbackEventModel(conferenceEventRequest, conference);
            var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
            try
            {
                await handler.HandleAsync(callbackEvent);
            }
            catch (ConferenceNotFoundException e)
            {
                _logger.LogError(e, $"Unable to retrieve conference details");
                return BadRequest();
            }

            try
            {
                await _videoApiClient.RaiseVideoEventAsync(conferenceEventRequest);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to update participant status for " +
                                    $"participant: {participantId} in conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private Guid GetIdForParticipantByUsernameInConference(Conference conference, string username)
        {
            return conference.Participants
                .Single(x => x.Username.Equals(username, StringComparison.CurrentCultureIgnoreCase)).Id;
        }

        [HttpGet("independentselftestresult")]
        [SwaggerOperation(OperationId = "GetIndependentTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetIndependentTestCallResultAsync(Guid participantId)
        {
            try
            {
                var score = await _videoApiClient.GetIndependentTestCallResultAsync(participantId);
                
                _logger.LogTrace($"Independent test call results fetched successfully for participant: {participantId}");
                return Ok(score);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get independent test call result for participant: {participantId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpGet("{conferenceId}/participant/{participantId}/heartbeatrecent")]
        [SwaggerOperation(OperationId = "GetHeartbeatDataForParticipant")]
        [ProducesResponseType(typeof(ParticipantHeartbeatResponse[]), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetHeartbeatDataForParticipantAsync(Guid conferenceId, Guid participantId)
        {
            try
            {
                var response = await _videoApiClient.GetHeartbeatDataForParticipantAsync(conferenceId, participantId);
                
                _logger.LogTrace($"Heartbeat data fetched successfully " +
                                 $"for participant: {participantId} in conference: {conferenceId}");
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get heartbeat data for participant: {participantId} in conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("{conferenceId}/participants/{participantId}/participantDisplayName")]
        [SwaggerOperation(OperationId = "UpdateParticipantDisplayName")]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> UpdateParticipantDisplayNameAsync(Guid conferenceId, Guid participantId, [FromBody] UpdateParticipantRequest participantRequest)
        {
            try
            {
               await  _videoApiClient.UpdateParticipantDetailsAsync(conferenceId, participantId, participantRequest);
               _logger.LogTrace($"Participant details updated successfully " +
                                $"for participant: {participantId} in conference: {conferenceId}");
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"Unable to update participant details " +
                                     $"for participant: {participantId} in conference: {conferenceId}");
                return StatusCode(ex.StatusCode, ex.Response);
            }

            return NoContent();
        }

        /// <summary>
        /// Get the participant details of a conference by id for VH officer
        /// </summary>
        /// <param name="conferenceId">The unique id of the conference</param>
        /// <returns>the participant details, if permitted</returns>
        [HttpGet("{conferenceId}/vhofficer/participants")]
        [ProducesResponseType(typeof(IEnumerable<ParticipantContactDetailsResponseVho>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetParticipantsWithContactDetailsByConferenceId")]
        [Authorize(AppRoles.VhOfficerRole)]
        public async Task<IActionResult> GetParticipantsWithContactDetailsByConferenceIdAsync(Guid conferenceId)
        {
            _logger.LogDebug("GetParticipantsWithContactDetailsByConferenceId");

            if (conferenceId == Guid.Empty)
            {
                _logger.LogWarning("Unable to get conference when id is not provided");
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");

                return BadRequest(ModelState);
            }
            try
            {
                var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, () =>
                {
                    _logger.LogTrace($"Retrieving conference details for conference: ${conferenceId}");

                    return _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
                });

                _logger.LogTrace($"Retrieving booking participants for hearing ${conference.HearingId}");
                var judgesInHearingsToday = await _videoApiClient.GetJudgesInHearingsTodayAsync();

                var response = ParticipantStatusResponseForVhoMapper.MapParticipantsTo(conference, judgesInHearingsToday);

                return Ok(response);

            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"Unable to retrieve conference: ${conferenceId}");

                return StatusCode(ex.StatusCode, ex.Response);
            }
            catch (BookingsApiException ex)
            {
                _logger.LogError(ex, $"Unable to retrieve booking participants from hearing with conferenceId: ${conferenceId}");

                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        [HttpGet("{conferenceId}/participants")]
        [SwaggerOperation(OperationId = "GetParticipantsByConferenceId")]
        [ProducesResponseType(typeof(List<ParticipantForUserResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetParticipantsByConferenceIdAsync(Guid conferenceId)
        {
            try
            {
                var response = await _videoApiClient.GetParticipantsByConferenceIdAsync(conferenceId);
                var participants = ParticipantForUserResponseMapper.MapParticipants(response);
                
                _logger.LogTrace($"Participants for conference: {conferenceId} successfully retrieved");
                return Ok(participants);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to retrieve participants for conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

    }
}
