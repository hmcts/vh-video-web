using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Request;
using VideoWeb.Services;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ParticipantsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IEventsServiceClient _eventsServiceClient;

        public ParticipantsController(IVideoApiClient videoApiClient, IEventsServiceClient eventsServiceClient)
        {
            _videoApiClient = videoApiClient;
            _eventsServiceClient = eventsServiceClient;
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
                return StatusCode(e.StatusCode, e);
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
            try
            {
                await _eventsServiceClient.PostEventsAsync(new ConferenceEventRequest
                {
                    Conference_id = conferenceId.ToString(),
                    Participant_id = updateParticipantStatusEventRequest.ParticipantId.ToString(),
                    Event_id = Guid.NewGuid().ToString(),
                    Event_type = updateParticipantStatusEventRequest.EventType,
                    Time_stamp_utc = DateTime.UtcNow,
                    Reason = "participant joining"
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