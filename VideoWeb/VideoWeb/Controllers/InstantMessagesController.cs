using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Castle.Core.Internal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Consumes("application/json")]
    [Produces("application/json")]
    [Route("conferences")]
    [ApiController]
    public class InstantMessagesController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<InstantMessagesController> _logger;
        private readonly IMessageDecoder _messageDecoder;
        private readonly IMapperFactory _mapperFactory;

        public InstantMessagesController(
            IVideoApiClient videoApiClient,
            ILogger<InstantMessagesController> logger,
            IMessageDecoder messageDecoder,
            IConferenceCache conferenceCache,
            IMapperFactory mapperFactory)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _messageDecoder = messageDecoder;
            _conferenceCache = conferenceCache;
            _mapperFactory = mapperFactory;
        }

        /// <summary>
        /// Get all the instant messages for a conference for a participant
        /// </summary>
        /// <param name="conferenceId">Id of the conference</param>
        /// <param name="participantUsername">the participant in the conference</param>
        /// <returns>List of instant messages involving participant in a conference</returns>
        [HttpGet("{conferenceId}/instantmessages/participant/{participantUsername}")]
        [SwaggerOperation(OperationId = "GetConferenceInstantMessageHistoryForParticipant")]
        [ProducesResponseType(typeof(List<ChatResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetConferenceInstantMessageHistoryForParticipantAsync(Guid conferenceId, string participantUsername)
        {
            _logger.LogDebug($"GetMessages for {conferenceId}");
            try
            {
                var messages =
                    await _videoApiClient.GetInstantMessageHistoryForParticipantAsync(conferenceId, participantUsername);
                if (!messages.Any())
                {
                    return Ok(new List<ChatResponse>());
                }

                var response = await MapMessages(messages, conferenceId);
                response = response.OrderBy(r => r.Timestamp).ToList();

                _logger.LogTrace($"Messages successfully retrieved for conference: {conferenceId}");

                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get messages for conference {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        /// <summary>
        /// Get number of unread messages for vho
        /// </summary>
        /// <param name="conferenceId">Id of the conference</param>
        /// <returns>Number of unread message</returns>
        [HttpGet("{conferenceId}/instantmessages/unread/vho")]
        [SwaggerOperation(OperationId = "GetNumberOfUnreadAdminMessagesForConference")]
        [ProducesResponseType(typeof(UnreadInstantMessageConferenceCountResponse), (int)HttpStatusCode.OK)]
        [Authorize(AppRoles.VhOfficerRole)]
        public async Task<IActionResult> GetUnreadMessagesForVideoOfficerAsync(Guid conferenceId)
        {
            _logger.LogDebug($"GetMessages for {conferenceId}");
            try
            {
                var messages = await _videoApiClient.GetInstantMessageHistoryAsync(conferenceId);
                if (messages.IsNullOrEmpty())
                {
                    return Ok(new UnreadInstantMessageConferenceCountResponse());
                }

                var conference = await _conferenceCache.GetOrAddConferenceAsync
                (
                    conferenceId,
                    () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
                );

                var unreadInstantMessageConferenceCountResponseMapper = _mapperFactory.Get<Conference, IList<InstantMessageResponse>, UnreadInstantMessageConferenceCountResponse>();
                var response = unreadInstantMessageConferenceCountResponseMapper.Map(conference, messages);
               
                _logger.LogTrace($"Messages successfully retrieved for conference: {conferenceId}");
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get messages for conference {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        /// <summary>
        /// Get number of unread messages for a participant
        /// </summary>
        /// <param name="conferenceId">Id of the conference</param>
        /// <param name="participantUsername">the participant in the conference</param>
        /// <returns>Number of unread message</returns>
        [HttpGet("{conferenceId}/instantmessages/unread/participant/{participantUsername}")]
        [SwaggerOperation(OperationId = "GetNumberOfUnreadAdminMessagesForConferenceByParticipant")]
        [ProducesResponseType(typeof(UnreadAdminMessageResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetUnreadMessagesForParticipantAsync(Guid conferenceId, string participantUsername)
        {
            _logger.LogDebug($"GetMessages for {conferenceId}");
            try
            {
                var messages =
                    await _videoApiClient.GetInstantMessageHistoryForParticipantAsync(conferenceId, participantUsername);
                if (messages.IsNullOrEmpty())
                {
                    return Ok(new UnreadAdminMessageResponse());
                }

                var conference = await _conferenceCache.GetOrAddConferenceAsync
                (
                    conferenceId,
                    () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
                );

                var unreadAdminMessageResponseMapper = _mapperFactory.Get<Conference, IList<InstantMessageResponse>, UnreadAdminMessageResponse>();
                var response = unreadAdminMessageResponseMapper.Map(conference, messages);
                
                _logger.LogTrace($"Messages successfully retrieved for conference: {conferenceId}");
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get messages for conference {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private async Task<List<ChatResponse>> MapMessages(IList<InstantMessageResponse> messages, Guid conferenceId)
        {
            var response = new List<ChatResponse>();

            if (!messages.Any())
            {
                return response;
            }

            var conference = await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );

            var username = User.Identity.Name;

            foreach (var message in messages)
            {
                var isUser = _messageDecoder.IsMessageFromUser(message, username);
                string fromDisplayName;
                if (isUser)
                {
                    fromDisplayName = "You";
                }
                else
                {
                    fromDisplayName = await _messageDecoder.GetMessageOriginatorAsync(conference, message);
                }

                var chatResponseMapper = _mapperFactory.Get<InstantMessageResponse, string, bool, ChatResponse>();
                var mapped = chatResponseMapper.Map(message, fromDisplayName, isUser);
                response.Add(mapped);
            }

            return response;
        }
    }
}
