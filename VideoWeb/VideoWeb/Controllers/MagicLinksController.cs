using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Enums;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("quickjoin")]
    public class MagicLinksController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<MagicLinksController> _logger;

        public MagicLinksController(IVideoApiClient videoApiClient, ILogger<MagicLinksController> logger)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;

        }

        [HttpGet("ValidateMagicLink/{hearingId}")]
        [AllowAnonymous]
        [SwaggerOperation(OperationId = "ValidateMagicLink")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ValidateMagicLink(Guid hearingId)
        {
            var conference = await _videoApiClient.GetConferenceByHearingRefIdAsync(hearingId, includeClosed: true);

            if (conference == null || conference.CurrentStatus == ConferenceState.Closed)
                return Ok(false);

            return Ok(true);
        }
    }
}
