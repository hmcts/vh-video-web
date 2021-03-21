using System;
using System.Collections.Generic;
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
using VideoWeb.Extensions;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Helpers;

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
        private readonly IMapperFactory _mapperFactory;
        private readonly IConsultationResponseTracker _consultationResponseTracker;


        public VideoEventsController(
            IVideoApiClient videoApiClient,
            IEventHandlerFactory eventHandlerFactory,
            IConferenceCache conferenceCache,
            ILogger<VideoEventsController> logger,
            IMapperFactory mapperFactory,
            IConsultationResponseTracker consultationResponseTracker)
        {
            _videoApiClient = videoApiClient;
            _eventHandlerFactory = eventHandlerFactory;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _consultationResponseTracker = consultationResponseTracker;
        }

        [HttpPost]
        [SwaggerOperation(OperationId = "SendEvent")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> SendHearingEventAsync(ConferenceEventRequest request)
        {
            try
            {
                var conferenceId = Guid.Parse(request.ConferenceId);
                var conference = await _conferenceCache.GetOrAddConferenceAsync(conferenceId, () =>
                {
                    _logger.LogTrace("Retrieving conference details for conference: {ConferenceId}", conferenceId);
                    return _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
                });
                await UpdateConferenceRoomParticipants(conference, request);

                var events = new List<ConferenceEventRequest>() {request};
                if (request.IsParticipantAVmr(conference, out var roomId))
                {
                    request.ParticipantRoomId = roomId.ToString();
                    request.ParticipantId = null;
                    events = request.CreateEventsForParticipantsInRoom(conference, roomId);
                }

                var callbackEvents = events.Select(e => TransformAndMapRequest(e, conference)).ToList();
                // DO NOT USE Task.WhenAll because the handlers are not thread safe and will overwrite Source<Variable> for each run
                foreach (var e in events)
                {
                    await SendEventToVideoApi(e);
                }

                foreach (var cb in callbackEvents)
                {
                    await PublishEventToUi(cb);
                }

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}", request.ConferenceId,
                    e.StatusCode);
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private Task SendEventToVideoApi(ConferenceEventRequest request)
        {
            if (request.EventType == EventType.VhoCall)
            {
                return Task.CompletedTask;
            }

            request = request.UpdateEventTypeForVideoApi();

            _logger.LogTrace("Raising video event: ConferenceId: {ConferenceId}, EventType: {EventType}",
                request.ConferenceId, request.EventType);

            return _videoApiClient.RaiseVideoEventAsync(request);
        }

        private CallbackEvent TransformAndMapRequest(ConferenceEventRequest request, Conference conference)
        {
            var isPhoneEvent = string.IsNullOrEmpty(request.Phone);
            if (!isPhoneEvent)
            {
                return null;
            }

            var callbackEventMapper = _mapperFactory.Get<ConferenceEventRequest, Conference, CallbackEvent>();
            var callbackEvent = callbackEventMapper.Map(request, conference);
            request.EventType = Enum.Parse<EventType>(callbackEvent.EventType.ToString());

            return callbackEvent;
        }

        private Task PublishEventToUi(CallbackEvent callbackEvent)
        {
            if (callbackEvent == null)
            {
                return Task.CompletedTask;
            }

            var handler = _eventHandlerFactory.Get(callbackEvent.EventType);
            return handler.HandleAsync(callbackEvent);
        }

        /// <summary>
        /// This updates the VMRs for a conference when a participant joins or leaves a VMR
        /// </summary>
        /// <param name="conference"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        private async Task UpdateConferenceRoomParticipants(Conference conference, ConferenceEventRequest request)
        {
            if (!request.IsParticipantAndVmrEvent())
            {
                return;
            }

            var roomId = long.Parse(request.ParticipantRoomId);
            var participantId = Guid.Parse(request.ParticipantId);


            switch (request.EventType)
            {
                case EventType.Joined:
                    conference.AddParticipantToRoom(roomId, participantId);
                    break;
                case EventType.Disconnected:
                    await _consultationResponseTracker.ClearResponses(conference, participantId);
                    conference.RemoveParticipantFromRoom(roomId, participantId);
                    break;
                default: return;
            }

            await _conferenceCache.UpdateConferenceAsync(conference);
        }
    }
}
