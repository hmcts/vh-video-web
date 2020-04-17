using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Extensions;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("audiorecording")]
    public class AudioRecordingController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<VenuesController> _logger;

        public AudioRecordingController(IVideoApiClient videoApiClient, ILogger<VenuesController> logger)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;

        }

        [HttpPost]
        [SwaggerOperation(OperationId = "StopAudioRecording")]
        [ProducesResponseType(typeof(AudioRecordingStopResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<AudioRecordingStopResponse>> StopAudioRecordingAsync(string CaseNumber, Guid HearingRefId )
        {
            _logger.LogDebug("StopAudioRecording");

            try
            {
                // var response = await _videoApiClient.StopAudioRecording(applicationId);

                var response = new AudioRecordingStopResponse { Success = true, Message = $"Recording {CaseNumber}_{HearingRefId} stopped"};
               return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to stop audio recording for hearingId: {HearingRefId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
