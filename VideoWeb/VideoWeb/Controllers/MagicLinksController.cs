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
using VideoApi.Contract.Requests;
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

        public MagicLinksController(IVideoApiClient videoApiClient, ILogger<MagicLinksController> logger)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
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
                var response = await _videoApiClient.ValidateMagicLinkAsync(hearingId);
                return Ok(response);
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
            var roleAsUserRole = (UserRole)Enum.Parse(typeof(UserRole), joinRequest.Role.ToString());

            if (roleAsUserRole != UserRole.MagicLinkObserver && roleAsUserRole != UserRole.MagicLinkParticipant)
            {
                throw new NotSupportedException(
                    $"Can only join as a magic user if the roles are MagicLinkParticipant or MagicLinkObserver. The Role was {roleAsUserRole}");
            }
            
            MagicLinkParticipantJoinResponse joinResponse = new MagicLinkParticipantJoinResponse()
            {
                Jwt = await _videoApiClient.AddMagicLinkParticipantAsync(hearingId, new AddMagicLinkParticipantRequest()
                {
                    Name = joinRequest.Name,
                    UserRole = roleAsUserRole
                })
            };
            
            return Ok(joinResponse);
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
