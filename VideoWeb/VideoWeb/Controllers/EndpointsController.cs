using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoWeb.Common;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Microsoft.AspNetCore.Components.Route("video-endpoints")]
public class EndpointsController(
    ILogger<EndpointsController> logger,
    IMapperFactory mapperFactory,
    IConferenceService conferenceService)
    : ControllerBase
{
    [HttpGet("{conferenceId}/participants")]
    [SwaggerOperation(OperationId = "GetVideoEndpointsForConference")]
    [ProducesResponseType(typeof(List<VideoEndpointResponse>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetVideoEndpointsForConferenceAsync(Guid conferenceId)
    {
        try
        {
            var conference = await conferenceService.GetConference(conferenceId);
            var videoEndpointResponseMapper = mapperFactory.Get<Endpoint, VideoEndpointResponse>();
            return Ok(conference.Endpoints.Select(videoEndpointResponseMapper.Map).ToList());
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, "Endpoints could not be fetched for ConferenceId: {ConferenceId}", conferenceId);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    [HttpGet("{conferenceId}/allowed-video-call-endpoints")]
    [SwaggerOperation(OperationId = "AllowedVideoCallEndpoints")]
    [ProducesResponseType(typeof(IList<AllowedEndpointResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> GetEndpointsLinkedToUser(Guid conferenceId)
    {
        {
            var username = User.Identity?.Name?.Trim() ??
                           throw new UnauthorizedAccessException("No username found in claims");
            var conference = await conferenceService.GetConference(conferenceId);
            var isHostOrJoh = conference.Participants.Exists(x =>
                (x.IsHost() || x.IsJudicialOfficeHolder()) && x.Username.Equals(User.Identity.Name?.Trim(),
                    StringComparison.InvariantCultureIgnoreCase));
            var usersEndpoints = conference.Endpoints;
            if (!isHostOrJoh)
                usersEndpoints = usersEndpoints.Where(ep =>
                    ep.DefenceAdvocate != null &&
                    ep.DefenceAdvocate.Equals(username, StringComparison.CurrentCultureIgnoreCase)).ToList();
            
            var allowedEndpointResponseMapper = mapperFactory.Get<Endpoint, AllowedEndpointResponse>();
            var response = usersEndpoints.Select(x => allowedEndpointResponseMapper.Map(x)).ToList();
            return Ok(response);
        }
    }
    
}
