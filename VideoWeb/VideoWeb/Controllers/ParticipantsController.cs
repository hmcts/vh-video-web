using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ParticipantsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IEventHandlerFactory _eventHandlerFactory;


        public ParticipantsController(IVideoApiClient videoApiClient, IEventHandlerFactory eventHandlerFactory)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
        }

        [HttpGet("{conferenceId}/participants/{participantId}/selftestresult")]
        [SwaggerOperation(OperationId = "GetTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetTestCallResultForParticipant(Guid conferenceId, Guid participantId)
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
        public async Task<IActionResult> UpdateParticipantStatus(Guid conferenceId, 
            UpdateParticipantStatusEventRequest updateParticipantStatusEventRequest)
        {
            var conferenceEventRequest = new ConferenceEventRequest
            {
                Conference_id = conferenceId.ToString(),
                Participant_id = updateParticipantStatusEventRequest.ParticipantId.ToString(),
                Event_id = Guid.NewGuid().ToString(),
                Event_type = updateParticipantStatusEventRequest.EventType,
                Time_stamp_utc = DateTime.UtcNow,
                Reason = EventTypeReasonMapper.Map(updateParticipantStatusEventRequest.EventType)
            };

            var callbackEvent = new CallbackEventMapper().MapConferenceEventToCallbackEventModel(conferenceEventRequest);
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

        [HttpGet("independentselftestresult")]
        [SwaggerOperation(OperationId = "GetIndependentTestCallResult")]
        [ProducesResponseType(typeof(TestCallScoreResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetIndependentTestCallResult(Guid participantId)
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
        [ProducesResponseType(typeof(IEnumerable<ParticipantHeartbeatResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
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
    }
}
