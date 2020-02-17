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

        public MessagesController(IVideoApiClient videoApiClient,ILogger<MessagesController> logger)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
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
                var mapper = new ChatResponseMapper();
                var username = User.Identity.Name;
                var response = messages.Select(x => mapper.MapToResponseModel(x, username));
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get messages for conference {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
