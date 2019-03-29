using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Consumes("application/json")]
    [Produces("application/json")]
    [Route("api/events")]
    [ApiController]
    public class EventsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;

        public EventsController(IVideoApiClient conferenceApiClient)
        {
            _videoApiClient = conferenceApiClient;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "SendEvent")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        public IActionResult SendHearingEvent(ConferenceEventRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                _videoApiClient.PostEvents(request);
                return Ok();
            }
            catch (VideoApiException e)
            {
                return BadRequest(e.Message);
            }
        }
    }
}