using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<VideoEventsController> _logger;

        public VideoEventsController(IVideoApiClient videoApiClient, 
            IEventHandlerFactory eventHandlerFactory, 
            IMemoryCache memoryCache, ILogger<VideoEventsController> logger)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _memoryCache = memoryCache;
            _logger = logger;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "SendEvent")]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SendHearingEvent(ConferenceEventRequest request)
        {
            try
            {
                _logger.LogTrace("Received callback from Kinly");
                _logger.LogError($"ConferenceId: {request.Conference_id}, EventType: {request.Event_type}");
                var callbackEvent = new CallbackEventMapper().MapConferenceEventToCallbackEventModel(request);
                if (_memoryCache.Get<Conference>(callbackEvent.ConferenceId) == null)
                {
                    try
                    {
                        _logger.LogError($"Retrieving conference details for conference: {callbackEvent.ConferenceId}");
                        var conference = await _videoApiClient.GetConferenceDetailsByIdAsync(callbackEvent.ConferenceId);
                        await ConferenceCache.AddConferenceToCache(conference, _memoryCache);
                    }
                    catch (VideoApiException e)
                    {
                        _logger.LogError($"ConferenceId: {request.Conference_id}, ErrorCode: {e.StatusCode}");
                        return StatusCode(e.StatusCode, e.Response);
                    }
                }

                var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
                await handler.HandleAsync(callbackEvent);
                if (callbackEvent.EventType != EventType.VhoCall)
                {
                    _logger.LogTrace($"Raising video event: ConferenceId: {request.Conference_id}, EventType: {request.Event_type}");
                    await _videoApiClient.RaiseVideoEventAsync(request);
                }

                return Ok();
            }
            catch (VideoApiException e)
            {
                _logger.LogError($"ConferenceId: {request.Conference_id}, ErrorCode: {e.StatusCode}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}