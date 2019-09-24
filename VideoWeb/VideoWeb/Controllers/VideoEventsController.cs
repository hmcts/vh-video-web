using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Mappings;
using VideoWeb.Services;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("callback")]
    public class VideoEventsController : Controller
    {
        private readonly IEventsServiceClient _eventsServiceClient;
        private readonly IEventHandlerFactory _eventHandlerFactory;

        public VideoEventsController(IEventsServiceClient eventsServiceClient, IEventHandlerFactory eventHandlerFactory)
        {
            _eventsServiceClient = eventsServiceClient;
            _eventHandlerFactory = eventHandlerFactory;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "SendEvent")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SendHearingEvent(ConferenceEventRequest request)
        {
            try
            {
                var callbackEvent = new CallbackEventMapper().MapConferenceEventToCallbackEventModel(request);
                var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
                
                await handler.HandleAsync(callbackEvent);
                await _eventsServiceClient.PostEventsAsync(request);
                
                return NoContent();
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}