using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
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

        public AudioRecordingController(IVideoApiClient videoApiClient)
        {
            _videoApiClient = videoApiClient;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "StopAudioRecording")]
        [ProducesResponseType(typeof(AudioRecordingStopResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> StopAudioRecordingAsync(string CaseNumber, Guid HearingRefId )
        {
            try
            {
                // var response = await _videoApiClient.StopAudioRecording(applicationId);

                var response = new AudioRecordingStopResponse { Success = true, Message = $"Recording {CaseNumber}_{HearingRefId} stopped"};
               return Ok(response);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
