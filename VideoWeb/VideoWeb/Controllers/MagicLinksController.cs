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
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Common.Security;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers
{
    
    [Produces("application/json")]
    [ApiController]
    [Route("quickjoin")]
    public class MagicLinksController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceCache _conferenceCache;
        private readonly IMapperFactory _mapperFactory;
        private readonly ILogger<MagicLinksController> _logger;

        public MagicLinksController(IVideoApiClient videoApiClient, IConferenceCache conferenceCache, IMapperFactory mapperFactory, ILogger<MagicLinksController> logger)
        {
            _videoApiClient = videoApiClient;
            _conferenceCache = conferenceCache;
            _mapperFactory = mapperFactory;
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
            try
            {
                var roleAsUserRole = (UserRole) Enum.Parse(typeof(UserRole), joinRequest.Role.ToString());

                if (roleAsUserRole != UserRole.MagicLinkObserver && roleAsUserRole != UserRole.MagicLinkParticipant)
                {
                    throw new NotSupportedException(
                        $"Can only join as a magic user if the roles are MagicLinkParticipant or MagicLinkObserver. The Role was {roleAsUserRole}");
                }

                var response = await _videoApiClient.AddMagicLinkParticipantAsync(hearingId,
                    new AddMagicLinkParticipantRequest()
                    {
                        Name = joinRequest.Name,
                        UserRole = roleAsUserRole
                    });

                await AddMagicLinkParticipantToConferenceCache(response);

                return Ok(new MagicLinkParticipantJoinResponse
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
        
        [HttpGet("isMagicLinkParticipantAuthorised")]
        [SwaggerOperation("joinConferenceAsAMagicLinkUser")]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.Forbidden)]
        public IActionResult IsAuthorised()
        {
            return Ok();
        }

        private async Task AddMagicLinkParticipantToConferenceCache(AddMagicLinkParticipantResponse response)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync(response.ConferenceId, () => _videoApiClient.GetConferenceDetailsByIdAsync(response.ConferenceId));
                
            var requestToParticipantMapper = _mapperFactory.Get<ParticipantDetailsResponse, Participant>();
            conference.AddParticipant(requestToParticipantMapper.Map(response.Participant));
            
            await _conferenceCache.UpdateConferenceAsync(conference);
        }
    }
}
