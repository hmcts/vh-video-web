using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("callback")]
    [Authorize(AuthenticationSchemes = "Callback")]
    public class VideoEventsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IEventHandlerFactory _eventHandlerFactory;
        private readonly IMemoryCache _memoryCache;

        public VideoEventsController(IVideoApiClient videoApiClient, 
            IEventHandlerFactory eventHandlerFactory, 
            IMemoryCache memoryCache)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _memoryCache = memoryCache;
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
                if (_memoryCache.Get<Conference>(callbackEvent.ConferenceId) == null)
                {
                    try
                    {
                        var conference = await _videoApiClient.GetConferenceDetailsByIdAsync(callbackEvent.ConferenceId);
                        await ConferenceCache.AddConferenceToCache(conference, _memoryCache);
                    }
                    catch (VideoApiException e)
                    {
                        return StatusCode(e.StatusCode, e.Response);
                    }
                }

                var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
                await handler.HandleAsync(callbackEvent);
                if (callbackEvent.EventType != EventType.VhoCall && callbackEvent.EventType != EventType.Close)
                {
                    await _videoApiClient.RaiseVideoEventAsync(request);
                }

                return NoContent();
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}