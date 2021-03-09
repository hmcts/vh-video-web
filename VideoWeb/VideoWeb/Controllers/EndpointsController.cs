using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;

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
        private readonly IConferenceCache _conferenceCache;

        public EndpointsController(
            IVideoApiClient videoApiClient,
            ILogger<EndpointsController> logger,
            IMapperFactory mapperFactory,
            IConferenceCache conferenceCache)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _conferenceCache = conferenceCache;
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
                _logger.LogError(e, "Endpoints could not be fetched for ConferenceId: {ConferenceId}", conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }


        [HttpGet("{conferenceId}/allowed-video-call-endpoints")]
        [SwaggerOperation(OperationId = "AllowedVideoCallEndpoints")]
        [ProducesResponseType(typeof(IList<AllowedEndpointResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetEndpointsLinkedToUser(Guid conferenceId)
        {
            var username = User.Identity.Name?.ToLower().Trim();
            var conference = await GetConference(conferenceId);
            var usersEndpoints = conference.Endpoints.Where(ep =>
                ep.DefenceAdvocateUsername != null &&
                ep.DefenceAdvocateUsername.Equals(username, StringComparison.CurrentCultureIgnoreCase)).ToList();
            var allowedEndpointResponseMapper = _mapperFactory.Get<Endpoint, AllowedEndpointResponse>();
            var response = usersEndpoints.Select(x => allowedEndpointResponseMapper.Map(x)).ToList();
            return Ok(response);
        }

        private Task<Conference> GetConference(Guid conferenceId)
        {
            return _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
        }
    }
}
