using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.EventHub.Handlers.Core;
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
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<VideoEventsController> _logger;

        public VideoEventsController(IVideoApiClient videoApiClient, 
            IEventHandlerFactory eventHandlerFactory, IConferenceCache conferenceCache, 
            ILogger<VideoEventsController> logger)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _conferenceCache = conferenceCache;
            _logger = logger;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "SendEvent")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SendHearingEventAsync(ConferenceEventRequest request)
        {
            try
            {
                _logger.LogTrace("Received callback from Kinly.");
                _logger.LogTrace($"ConferenceId: {request.Conference_id}, EventType: {request.Event_type}, Participant ID : {request.Participant_id}");
                var callbackEvent = CallbackEventMapper.MapConferenceEventToCallbackEventModel(request);
                if (await _conferenceCache.GetConferenceAsync(callbackEvent.ConferenceId) == null)
                {
                    try
                    {
                        _logger.LogTrace($"Retrieving conference details for conference: {callbackEvent.ConferenceId}");
                        var conference = await _videoApiClient.GetConferenceDetailsByIdAsync(callbackEvent.ConferenceId);
                        await _conferenceCache.AddConferenceAsync(conference);
                    }
                    catch (VideoApiException e)
                    {
                        _logger.LogError(e, $"ConferenceId: {request.Conference_id}, ErrorCode: {e.StatusCode}");
                        return StatusCode(e.StatusCode, e.Response);
                    }
                }

                if (callbackEvent.EventType != EventType.VhoCall)
                {
                    _logger.LogTrace($"Raising video event: ConferenceId: {request.Conference_id}, EventType: {request.Event_type}");
                    await _videoApiClient.RaiseVideoEventAsync(request);
                }

                var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
                await handler.HandleAsync(callbackEvent);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"ConferenceId: {request.Conference_id}, ErrorCode: {e.StatusCode}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
