using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoApi.Client;
using EndpointResponse = VideoApi.Contract.Responses.EndpointResponse;

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
        private readonly IBookingsApiClient _bookingApi;

        public EndpointsController(
            IVideoApiClient videoApiClient,
            ILogger<EndpointsController> logger,
            IMapperFactory mapperFactory,
            IConferenceCache conferenceCache,
            IBookingsApiClient bookingApi)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _mapperFactory = mapperFactory;
            _conferenceCache = conferenceCache;
            _bookingApi = bookingApi;
        }

        [HttpGet("{conferenceId}/participants")]
        [SwaggerOperation(OperationId = "GetVideoEndpointsForConference")]
        [ProducesResponseType(typeof(List<VideoEndpointResponse>), (int)HttpStatusCode.OK)]
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
            var username = User?.Identity?.Name?.Trim() ?? throw new UnauthorizedAccessException("No username found in claims");
            var user = await _bookingApi.GetPersonByUsernameAsync(username);
            var conference = await GetConference(conferenceId);
            var isHostOrJoh = conference.Participants.Any(x => (x.IsHost() || x.IsJudicialOfficeHolder()) &&
                            x.Username.Equals(username, StringComparison.InvariantCultureIgnoreCase));

            var usersEndpoints = conference.Endpoints;
            if(!isHostOrJoh)
                usersEndpoints = GetUsersEndpoints(usersEndpoints, user);
            
            var allowedEndpointResponseMapper = _mapperFactory.Get<Endpoint, AllowedEndpointResponse>();
            var response = usersEndpoints.Select(x => allowedEndpointResponseMapper.Map(x)).ToList();
            return Ok(response);
        }

        private static List<Endpoint> GetUsersEndpoints(List<Endpoint> usersEndpoints, PersonResponse user)
        {
            return usersEndpoints
                .Where(ep => ep.DefenceAdvocateUsername != null && 
                             (ep.DefenceAdvocateUsername.Equals(user.Username, StringComparison.CurrentCultureIgnoreCase) ||
                              ep.DefenceAdvocateUsername.Equals(user.ContactEmail, StringComparison.CurrentCultureIgnoreCase)))
                .ToList();
        }

        private Task<Conference> GetConference(Guid conferenceId)
        {
            return _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
        }
    }
}
