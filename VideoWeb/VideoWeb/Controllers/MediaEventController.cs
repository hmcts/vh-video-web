using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Request;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class MediaEventController: Controller
    {
        private readonly IVideoApiClient _videoApiClient;

        public MediaEventController(IVideoApiClient videoApiClient)
        {
            _videoApiClient = videoApiClient;
        }

        [HttpPost("{conferenceId}/mediaevents")]
        [SwaggerOperation(OperationId = "AddMediaEventToConference")]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> AddMediaEventToConference(Guid conferenceId, [FromBody] AddMediaEventRequest addMediaEventRequest)
        {
            try
            {
                await _videoApiClient.PostEventsAsync(new ConferenceEventRequest
                {
                    Conference_id = conferenceId.ToString(),
                    Participant_id = addMediaEventRequest.ParticipantId.ToString(),
                    Event_id = Guid.NewGuid().ToString(),
                    Event_type = addMediaEventRequest.EventType,
                    Time_stamp_utc = DateTime.UtcNow,
                    Reason = "media permission denied"
                });

                return NoContent();
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e);
            }
        }

        [HttpPost("{conferenceId}/mediaproblem")]
        [SwaggerOperation(OperationId = "AddSelfTestFailureEventToConference")]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> AddSelfTestFailureEventToConference(Guid conferenceId, 
            [FromBody] AddSelfTestFailureEventRequest addSelfTestFailureEventRequest)
        {
            try
            {
                await _videoApiClient.PostEventsAsync(new ConferenceEventRequest
                {
                    Conference_id = conferenceId.ToString(),
                    Participant_id = addSelfTestFailureEventRequest.ParticipantId.ToString(),
                    Event_id = Guid.NewGuid().ToString(),
                    Event_type = addSelfTestFailureEventRequest.EventType,
                    Time_stamp_utc = DateTime.UtcNow,
                    Reason = $"Failed self-test ({ addSelfTestFailureEventRequest.SelfTestFailureReason })"
                });

                return NoContent();
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e);
            }
        }
    }
}