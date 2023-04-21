using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using VideoWeb.Common.Models;
using VideoApi.Client;

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

        [HttpGet("audiostreams/{hearingId}/{wowzaSingleApp}")]
        [SwaggerOperation(OperationId = "GetAudioStreamInfo")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        [Authorize("Host")]
        public async Task<IActionResult> GetAudioStreamInfoAsync(Guid hearingId, bool wowzaSingleApp)
        {
            try
            {
                var response = await _videoApiClient.GetAudioStreamInfoAsync(hearingId, wowzaSingleApp);
                return Ok(response.IsRecording);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get audio recording stream info for hearingId: {hearingId}");
                
                if (e.StatusCode.Equals((int)HttpStatusCode.NotFound))
                    return Ok(false);
                
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpDelete("audiostreams/{hearingId}")]
        [SwaggerOperation(OperationId = "StopAudioRecording")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [Authorize(AppRoles.VhOfficerRole)]
#pragma warning disable S1133
        [Obsolete("This method is no longer used and will be removed in a future release")]
#pragma warning restore S1133
        public async Task<ActionResult> StopAudioRecordingAsync(Guid hearingId)
        {
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
