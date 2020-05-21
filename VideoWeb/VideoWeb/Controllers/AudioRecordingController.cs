using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
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

        [HttpGet("audiostreams/{hearingId}")]
        [SwaggerOperation(OperationId = "GetAudioStreamInfo")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAudioStreamInfoAsync(Guid hearingId)
        {
            _logger.LogDebug("GetAudioStreamInfo");

            try
            {
              var response = await _videoApiClient.GetAudioStreamInfoAsync(hearingId);

                return Ok(response.Is_recording);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get audio recording stream info for hearingId: {hearingId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpDelete("audiostreams/{hearingId}")]
        [SwaggerOperation(OperationId = "StopAudioRecording")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> StopAudioRecordingAsync(Guid hearingId)
        {
            _logger.LogDebug("StopAudioRecording");

            try
            {
                await _videoApiClient.DeleteAudioApplicationAsync(hearingId);

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
