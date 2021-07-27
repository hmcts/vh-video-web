using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoWeb.Common.Models;
using VideoWeb.Common.Security;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Controllers
{
    
    [Produces("application/json")]
    [ApiController]
    [Route("quickjoin")]
    public class MagicLinksController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<MagicLinksController> _logger;
        private readonly IMagicLinksJwtTokenProvider _jwtTokenProvider;

        public MagicLinksController(IVideoApiClient videoApiClient, ILogger<MagicLinksController> logger, IMagicLinksJwtTokenProvider jwtTokenProvider)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _jwtTokenProvider = jwtTokenProvider;
        }

        [HttpGet("GetMagicLinkParticipantRoles")]
        [AllowAnonymous]
        [SwaggerOperation(OperationId = "GetMagicLinkParticipantRoles")]
        [ProducesResponseType(typeof(List<Role>), StatusCodes.Status200OK)]
        public IActionResult GetMagicLinkParticipantRoles()
        {
            var magicParticipantRoles = new List<Role>
            {
                Role.MagicLinkParticipant, Role.MagicLinkObserver
            };

            return Ok(magicParticipantRoles);
        }

        [HttpGet("ValidateMagicLink/{hearingId}")]
        [AllowAnonymous]
        [SwaggerOperation(OperationId = "ValidateMagicLink")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        public async Task<IActionResult> ValidateMagicLink(Guid hearingId)
        {
            try
            {
                return Ok(true);
            }
            catch(VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get conference with hearing id: {hearingId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("joinConferenceAsAMagicLinkUser/${hearingId}")]
        [AllowAnonymous]
        [SwaggerOperation("joinConferenceAsAMagicLinkUser")]
        [ProducesResponseType(typeof(MagicLinkParticipantJoinResponse), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> Join(Guid hearingId,
            [FromBody] MagicLinkParticipantJoinRequest joinRequest)
        {
            MagicLinkParticipantJoinResponse joinResponse = new MagicLinkParticipantJoinResponse()
            {
                Jwt = _jwtTokenProvider.GenerateToken(joinRequest.Name, joinRequest.Name, joinRequest.Role.ToString())
            };
            
            return Ok(await Task.FromResult(joinResponse));
        }
        
        [HttpGet("isMagicLinkParticipantAuthorised")]
        [SwaggerOperation("joinConferenceAsAMagicLinkUser")]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.Forbidden)]
        public IActionResult IsAuthorised()
        {
            return Ok();
        }
    }
}
