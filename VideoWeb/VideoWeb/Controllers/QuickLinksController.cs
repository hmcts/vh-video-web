using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers
{
    
    [Produces("application/json")]
    [ApiController]
    [Route("quickjoin")]
    public class QuickLinksController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly IMapperFactory _mapperFactory;
        private readonly ILogger<QuickLinksController> _logger;

        public QuickLinksController(IVideoApiClient videoApiClient, IConferenceCache conferenceCache, IMapperFactory mapperFactory, ILogger<QuickLinksController> logger)
        {
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
            _mapperFactory = mapperFactory;
            _logger = logger;
        }

        [HttpGet("GetQuickLinkParticipantRoles")]
        [AllowAnonymous]
        [SwaggerOperation(OperationId = "GetQuickLinkParticipantRoles")]
        [ProducesResponseType(typeof(List<Role>), StatusCodes.Status200OK)]
        public IActionResult GetQuickLinkParticipantRoles()
        {
            var quickParticipantRoles = new List<Role>
            {
                Role.QuickLinkParticipant, Role.QuickLinkObserver
            };

            return Ok(quickParticipantRoles);
        }

        [HttpGet("ValidateQuickLink/{hearingId}")]
        [AllowAnonymous]
        [SwaggerOperation(OperationId = "ValidateQuickLink")]
        [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
        public async Task<IActionResult> ValidateQuickLink(Guid hearingId)
        {
            try
            {
                var response = await _videoApiClient.ValidateQuickLinkAsync(hearingId);
                return Ok(response);
            }
            catch(VideoApiException e)
            {
                _logger.LogError(e, $"Unable to get conference with hearing id: {hearingId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("joinConferenceAsAQuickLinkUser/${hearingId}")]
        [AllowAnonymous]
        [SwaggerOperation("joinConferenceAsAQuickLinkUser")]
        [ProducesResponseType(typeof(QuickLinkParticipantJoinResponse), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> Join(Guid hearingId,
            [FromBody] QuickLinkParticipantJoinRequest joinRequest)
        {
            try
            {
                var roleAsUserRole = (UserRole) Enum.Parse(typeof(UserRole), joinRequest.Role.ToString());

                if (roleAsUserRole != UserRole.QuickLinkObserver && roleAsUserRole != UserRole.QuickLinkParticipant)
                {
                    throw new NotSupportedException(
                        $"Can only join as a quick link user if the roles are QuickLinkParticipant or QuickLinkObserver. The Role was {roleAsUserRole}");
                }

                var request = new AddQuickLinkParticipantRequest
                {
                    Name = joinRequest.Name,
                    UserRole = roleAsUserRole
                };
                
                var response = await _videoApiClient.AddQuickLinkParticipantAsync(hearingId, request);

                await AddQuickLinkParticipantToConferenceCache(response);

                return Ok(new QuickLinkParticipantJoinResponse
                {
                    Jwt = response.Token
                });
            }
            catch (NotSupportedException e)
            {
                return StatusCode(StatusCodes.Status400BadRequest, e.Message);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to join hearing: {hearingId} {joinRequest.Name} {joinRequest.Role}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
        
        [HttpGet("isQuickLinkParticipantAuthorised")]
        [SwaggerOperation("joinConferenceAsAQuickLinkUser")]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.Forbidden)]
        public IActionResult IsAuthorised()
        {
            return Ok();
        }

        private async Task AddQuickLinkParticipantToConferenceCache(AddQuickLinkParticipantResponse response)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync(response.ConferenceId, () => _videoApiClient.GetConferenceDetailsByIdAsync(response.ConferenceId));
                
            var requestToParticipantMapper = _mapperFactory.Get<ParticipantDetailsResponse, Participant>();
            conference.AddParticipant(requestToParticipantMapper.Map(response.ParticipantDetails));
            
            await _conferenceCache.UpdateConferenceAsync(conference);
        }
    }
}
