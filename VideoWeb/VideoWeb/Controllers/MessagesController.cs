using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Consumes("application/json")]
    [Produces("application/json")]
    [Route("conferences")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<MessagesController> _logger;
        private readonly IUserApiClient _userApiClient;

        public MessagesController(IVideoApiClient videoApiClient, ILogger<MessagesController> logger,
            IUserApiClient userApiClient)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _userApiClient = userApiClient;
        }

        /// <summary>
        /// Get all the chat messages for a conference
        /// </summary>
        /// <param name="conferenceId">Id of the conference</param>
        /// <returns>Chat messages</returns>
        [HttpGet("{conferenceId}/messages")]
        [SwaggerOperation(OperationId = "GetConferenceChatHistory")]
        [ProducesResponseType(typeof(List<ChatResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetConferenceChatHistory(Guid conferenceId)
        {
            _logger.LogDebug($"GetMessages for {conferenceId}");
            try
            {
                var messages = await _videoApiClient.GetMessagesAsync(conferenceId);
                var mapper = new ChatResponseMapper(_userApiClient);

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
            IEnumerable<MessageResponse> messages, Guid conferenceId)
        {
            var conference = await _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);
            var username = User.Identity.Name;
            var response = new List<ChatResponse>();
            foreach (var message in messages)
            {
                await mapper.MapToResponseModel(message, conference, username);
            }

            return response;
        }
    }
}
