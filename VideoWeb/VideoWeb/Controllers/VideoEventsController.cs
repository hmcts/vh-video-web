using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("callback")]
    [Authorize(AuthenticationSchemes = "Callback")]
    [AllowAnonymous]
    public class VideoEventsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IEventHandlerFactory _eventHandlerFactory;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<VideoEventsController> _logger;
        private readonly IMapperFactory _mapperFactory;


        public VideoEventsController(
            IVideoApiClient videoApiClient,
            IEventHandlerFactory eventHandlerFactory,
            IConferenceCache conferenceCache,
            ILogger<VideoEventsController> logger,
            IMapperFactory mapperFactory)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "SendEvent")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SendHearingEventAsync(ConferenceEventRequest request)
        {
            try
            {
                var conferenceId = Guid.Parse(request.ConferenceId);
                var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, () =>
                {
                    _logger.LogTrace($"Retrieving conference details for conference: ${conferenceId}");
                    return _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
                });

                var callbackEventMapper = _mapperFactory.Get<ConferenceEventRequest, Conference, CallbackEvent>();
                var callbackEvent = callbackEventMapper.Map(request, conference);
                request.EventType = (VideoApi.Contract.Enums.EventType)Enum.Parse<EventType>(callbackEvent.EventType.ToString());

                if (IsRoomEvent(request, conference, out var roomId))
                {
                    request.ParticipantRoomId = roomId.ToString();
                    request.ParticipantId = null;
                }

                if (callbackEvent.EventType != EventType.VhoCall)
                {
                    _logger.LogTrace("Raising video event: ConferenceId: {ConferenceId}, EventType: {EventType}",
                        request.ConferenceId, request.EventType);
                    await _videoApiClient.RaiseVideoEventAsync(request);
                }

                if (!string.IsNullOrEmpty(request.Phone))
                {
                    return NoContent();
                }

                var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
                await handler.HandleAsync(callbackEvent);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"ConferenceId: {request.ConferenceId}, ErrorCode: {e.StatusCode}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private bool IsRoomEvent(ConferenceEventRequest request, Conference conference, out long roomId)
        {
            if (!long.TryParse(request.ParticipantId, out roomId)) return false;
            var id = roomId;
            return conference.CivilianRooms.Any(x => x.Id == id);
        }
    }
}
