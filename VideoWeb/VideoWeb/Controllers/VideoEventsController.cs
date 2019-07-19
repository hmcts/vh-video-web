using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Services;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("events")]
    public class VideoEventsController : Controller
    {
        private readonly IEventsServiceClient _eventsServiceClient;

        public VideoEventsController(IEventsServiceClient eventsServiceClient)
        {
            _eventsServiceClient = eventsServiceClient;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "SendEvent")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SendHearingEvent(ConferenceEventRequest request)
        {
            try
            {
                await _eventsServiceClient.PostEventsAsync(request);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e);
            }
        }
    }
}