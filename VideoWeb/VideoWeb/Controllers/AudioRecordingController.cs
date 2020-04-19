using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class AudioRecordingController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<VenuesController> _logger;

        public AudioRecordingController(IVideoApiClient videoApiClient, ILogger<VenuesController> logger)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;

        }

        [HttpDelete("audiostreams/{hearingId}")]
        [SwaggerOperation(OperationId = "StopAudioRecording")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult> StopAudioRecordingAsync(Guid hearingId)
        {
            _logger.LogDebug("StopAudioRecording");

            try
            {
                await _videoApiClient.DeleteAudioStreamAsync(hearingId);

                return Ok();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to stop audio recording for hearingId: {hearingId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
