using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("events")]
    public class VideoEventsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;

        public VideoEventsController(IVideoApiClient videoApiClient)
        {
            _videoApiClient = videoApiClient;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "SendEvent")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SendHearingEvent(ConferenceEventRequest request)
        {
            try
            {
                await _videoApiClient.PostEventsAsync(request);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                switch (e.StatusCode)
                {
                    case (int) HttpStatusCode.BadRequest:
                        return BadRequest(e.Response);
                    default:
                        return StatusCode((int) HttpStatusCode.InternalServerError, e);
                }
            }
        }
    }
}