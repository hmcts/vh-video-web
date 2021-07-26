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
                Jwt = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IlJvYiBCZW5uZXR0IiwiZ2l2ZW5fbmFtZSI6IlJvYiBCZW5uZXR0IiwiZmFtaWx5X25hbWUiOiJSb2IgQmVubmV0dCIsInByZWZlcnJlZF91c2VybmFtZSI6IlJvYiBCZW5uZXR0IiwibmFtZSI6IlJvYiBCZW5uZXR0Iiwicm9sZSI6IkNpdGl6ZW4iLCJuYmYiOjE2MjcyOTYzOTgsImV4cCI6MTYyNzMyNTMxOCwiaWF0IjoxNjI3Mjk2NDU4LCJpc3MiOiJodHRwczovL3ZoLXZpZGVvLXdlYi1kZXYuYXp1cmV3ZWJzaXRlcy5uZXQvOThhNWRiM2QtMGY5MS00MDNmLWI3ZGMtZDFhMjcyZjQ2ZjNiIn0.z_WADPPmGsa4_zY5YVRo3vDSvrHqcP0iS1T1orcegkDPimLi23M_ROktEgJRnhOnb1ZsXcd_qzCN9HppS1LYSQ"
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
        
        [HttpGet("revokeMagicLinkUserToken")]
        [SwaggerOperation("revokeMagicLinkUserToken")]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public IActionResult RevokeToken()
        {
            return Ok();
        }
    }
}
