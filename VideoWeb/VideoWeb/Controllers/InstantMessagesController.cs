using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
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
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<InstantMessagesController> _logger;
        private readonly IMessageDecoder _messageDecoder;

        public InstantMessagesController(IVideoApiClient videoApiClient, ILogger<InstantMessagesController> logger,
            IMessageDecoder messageDecoder, IMemoryCache memoryCache)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _messageDecoder = messageDecoder;
            _memoryCache = memoryCache;
        }

        /// <summary>
        /// Get all the instant messages for a conference
        /// </summary>
        /// <param name="conferenceId">Id of the conference</param>
        /// <returns>List of instant messages</returns>
        [HttpGet("{conferenceId}/instantmessages")]
        [SwaggerOperation(OperationId = "GetConferenceInstantMessageHistory")]
        [ProducesResponseType(typeof(List<ChatResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetConferenceInstantMessageHistory(Guid conferenceId)
        {
            _logger.LogDebug($"GetMessages for {conferenceId}");
            try
            {
                var messages = await _videoApiClient.GetInstantMessageHistoryAsync(conferenceId);
                if (!messages.Any())
                {
                    return Ok(new List<ChatResponse>());
                }

                var mapper = new ChatResponseMapper();
                var response = await MapMessages(mapper, messages, conferenceId);
                response = response.OrderBy(r => r.Timestamp).ToList();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get messages for conference {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private async Task<List<ChatResponse>> MapMessages(ChatResponseMapper mapper,
            IList<InstantMessageResponse> messages, Guid conferenceId)
        {
            var response = new List<ChatResponse>();
            if (!messages.Any())
            {
                return response;
            }
            var conference = _memoryCache.Get<ConferenceDetailsResponse>($"{conferenceId}_details");
            var username = User.Identity.Name;

            foreach (var message in messages)
            {
                var isUser = _messageDecoder.IsMessageFromUser(message, username);
                string from;
                if (isUser)
                {
                    from = "You";
                }
                else
                {
                    from = await _messageDecoder.GetMessageOriginatorAsync(conference, message);
                }
                var mapped = mapper.MapToResponseModel(message, from, isUser);
                response.Add(mapped);
            }

            return response;
        }
    }
}
