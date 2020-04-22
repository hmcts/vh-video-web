using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Extensions;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Mappings;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using UpdateParticipantRequest = VideoWeb.Services.Video.UpdateParticipantRequest;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;

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
        private readonly IBookingsApiClient _bookingsApiClient;

        public ParticipantsController(IVideoApiClient videoApiClient, IEventHandlerFactory eventHandlerFactory,
            IConferenceCache conferenceCache, ILogger<ParticipantsController> logger, IBookingsApiClient bookingsApiClient)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _bookingsApiClient = bookingsApiClient;
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
                return Ok(score);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("{conferenceId}/participantstatus")]
        [SwaggerOperation(OperationId = "UpdateParticipantStatus")]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> UpdateParticipantStatusAsync(Guid conferenceId,
            UpdateParticipantStatusEventRequest updateParticipantStatusEventRequest)
        {
            var username = User.Identity.Name;
            var participantId = await GetIdForParticipantByUsernameInConference(conferenceId, username);
            var conferenceEventRequest = new ConferenceEventRequest
            {
                Conference_id = conferenceId.ToString(),
                Participant_id = participantId.ToString(),
                Event_id = Guid.NewGuid().ToString(),
                Event_type = updateParticipantStatusEventRequest.EventType,
                Time_stamp_utc = DateTime.UtcNow,
                Reason = EventTypeReasonMapper.Map(updateParticipantStatusEventRequest.EventType)
            };

            var callbackEvent = CallbackEventMapper.MapConferenceEventToCallbackEventModel(conferenceEventRequest);
            var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
            try
            {
                await handler.HandleAsync(callbackEvent);
            }
            catch (ConferenceNotFoundException)
            {
                return BadRequest();
            }

            try
            {
                await _videoApiClient.RaiseVideoEventAsync(conferenceEventRequest);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private async Task<Guid> GetIdForParticipantByUsernameInConference(Guid conferenceId, string username)
        {
            var conference = await _conferenceCache.GetConferenceAsync(conferenceId);
            if (conference == null)
            {
                var conferenceDetail = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
                await _conferenceCache.AddConferenceAsync(conferenceDetail);
                conference = await _conferenceCache.GetConferenceAsync(conferenceId);
            }

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
                return Ok(score);
            }
            catch (VideoApiException e)
            {
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

                return Ok(response);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("{conferenceId}/participants/{participantId}/participantDisplayName")]
        [SwaggerOperation(OperationId = "UpdateParticipantDisplayName")]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> UpdateParticipantDisplayNameAsync(Guid conferenceId, Guid participantId, [FromBody] UpdateParticipantRequest participantRequest)
        {
            if (conferenceId == Guid.Empty || participantId == Guid.Empty)
            {
                return BadRequest("Please provide a valid conference Id and participant Id");
            }

            try
            {
               await  _videoApiClient.UpdateParticipantDetailsAsync(conferenceId, participantId, participantRequest);
            }
            catch (VideoApiException ex)
            {
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
        [SwaggerOperation(OperationId = "GetParticipantsByConferenceIdVho")]
        public async Task<ActionResult<ConferenceResponseVho>> GetParticipantsByConferenceIdVhoAsync(Guid conferenceId)
        {
            _logger.LogDebug("GetParticipantsByConferenceIdVho");
            
            if (conferenceId == Guid.Empty)
            {
                _logger.LogWarning("Unable to get conference when id is not provided");
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
                
                return BadRequest(ModelState);
            }

            var username = User.Identity.Name.ToLower().Trim();

            _logger.LogTrace("Checking to see if user is a VH Officer");
            if (!User.IsInRole(Role.VideoHearingsOfficer.EnumDataMemberAttr()))
            {
                _logger.LogWarning($"Failed to get conference: ${conferenceId}, {username} is not a VH officer");
                
                return Unauthorized("User must be a VH Officer");
            }

            try
            {
                var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, () =>
                {
                    _logger.LogTrace($"Retrieving conference details for conference: ${conferenceId}");
                    
                    return _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
                });
                
                _logger.LogTrace($"Retrieving booking participants for hearing ${conference.HearingId}");
                var bookingParticipants = await _bookingsApiClient.GetAllParticipantsInHearingAsync(conference.HearingId);
                
                var response = ParticipantResponseForVhoMapper.MapParticipantsTo(conference.Participants, bookingParticipants);

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
    }
}
