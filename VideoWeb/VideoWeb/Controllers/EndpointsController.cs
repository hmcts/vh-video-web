using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Microsoft.AspNetCore.Components.Route("video-endpoints")]
    public class EndpointsController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<EndpointsController> _logger;
        private readonly IMapperFactory _mapperFactory;

        public EndpointsController(
            IVideoApiClient videoApiClient,
            ILogger<EndpointsController> logger,
            IMapperFactory mapperFactory)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _mapperFactory = mapperFactory;
        }

        [HttpGet("{conferenceId}/participants")]
        [SwaggerOperation(OperationId = "GetVideoEndpointsForConference")]
        [ProducesResponseType(typeof(List<VideoEndpointResponse>), (int)HttpStatusCode.OK)]
        [Authorize(AppRoles.JudgeRole)]
        public async Task<IActionResult> GetVideoEndpointsForConferenceAsync(Guid conferenceId)
        {
            try
            {
                var endpoints = await _videoApiClient.GetEndpointsForConferenceAsync(conferenceId);
                var videoEndpointResponseMapper = _mapperFactory.Get<EndpointResponse, int, VideoEndpointResponse>();
                var response = endpoints.Select(videoEndpointResponseMapper.Map).ToList();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to get video endpoints for conference");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
